import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentProvider, CreatePaymentResult, PaymentResult } from './payment-provider.interface';

@Injectable()
export class PayPalProvider implements IPaymentProvider {
  name = 'paypal';
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get('PAYPAL_CLIENT_ID');
    this.clientSecret = this.configService.get('PAYPAL_CLIENT_SECRET');
    this.baseUrl = this.configService.get('PAYPAL_MODE') === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const data = await response.json();
    return data.access_token;
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
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.quoteId,
            description: `Presupuesto ${params.quoteReference}`,
            amount: {
              currency_code: params.currency,
              value: params.amount.toFixed(2),
            },
            custom_id: params.quoteReference,
          },
        ],
        application_context: {
          brand_name: 'Bolthorn Makers',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: params.successUrl,
          cancel_url: params.cancelUrl,
        },
      }),
    });
    const order = await response.json();

    const approvalLink = order.links?.find((l: any) => l.rel === 'approve')?.href;

    return {
      redirectUrl: approvalLink || order.links?.[0]?.href,
      providerPaymentId: order.id,
    };
  }

  async capturePayment(orderId: string): Promise<PaymentResult> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

    return {
      success: data.status === 'COMPLETED',
      providerPaymentId: orderId,
      amount: capture?.amount?.value ? parseFloat(capture.amount.value) : 0,
      status: data.status,
    };
  }

  async refundPayment(captureId: string, amount?: number): Promise<PaymentResult> {
    const token = await this.getAccessToken();
    const body: any = {};
    if (amount) body.amount = { value: amount.toFixed(2), currency_code: 'EUR' };

    const response = await fetch(`${this.baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    return {
      success: data.status === 'COMPLETED',
      providerPaymentId: data.id,
      amount: data.amount?.value ? parseFloat(data.amount.value) : 0,
      status: data.status,
    };
  }

  async verifyWebhook(payload: any, signature: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: payload.auth_algo,
          cert_url: payload.cert_url,
          transmission_id: payload.transmission_id,
          transmission_sig: payload.transmission_sig,
          transmission_time: payload.transmission_time,
          webhook_id: this.configService.get('PAYPAL_WEBHOOK_ID'),
          webhook_event: payload.webhook_event,
        }),
      });
      const result = await response.json();
      return result.verification_status === 'SUCCESS';
    } catch {
      return false;
    }
  }
}
