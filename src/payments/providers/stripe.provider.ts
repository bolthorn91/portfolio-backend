import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { IPaymentProvider, CreatePaymentResult, PaymentResult } from './payment-provider.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  name = 'stripe';
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-06-24.dahlia',
    });
  }

  async createCheckoutSession(params: {
    amount: number;
    currency: string;
    quoteReference: string;
    quoteId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<CreatePaymentResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: `Presupuesto ${params.quoteReference}`,
            },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        quoteId: params.quoteId,
        quoteReference: params.quoteReference,
        ...params.metadata,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    return {
      redirectUrl: session.url,
      providerPaymentId: session.id,
    };
  }

  async capturePayment(sessionId: string): Promise<PaymentResult> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    return {
      success: session.payment_status === 'paid',
      providerPaymentId: sessionId,
      amount: session.amount_total / 100,
      status: session.payment_status,
    };
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
    return {
      success: refund.status === 'succeeded',
      providerPaymentId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    };
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.configService.get('STRIPE_WEBHOOK_SECRET'),
      );
      return true;
    } catch {
      return false;
    }
  }
}
