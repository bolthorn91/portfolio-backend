import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeProvider } from './providers/stripe.provider';
import { PayPalProvider } from './providers/paypal.provider';
import { IPaymentProvider } from './providers/payment-provider.interface';

@Injectable()
export class PaymentsService {
  private providers: Map<string, IPaymentProvider> = new Map();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private stripeProvider: StripeProvider,
    private paypalProvider: PayPalProvider,
  ) {
    this.providers.set('stripe', this.stripeProvider);
    this.providers.set('paypal', this.paypalProvider);
  }

  getAvailableProviders() {
    return Array.from(this.providers.keys()).map((name) => ({
      name,
      methods: name === 'stripe'
        ? ['card', 'bizum', 'apple_pay', 'google_pay']
        : ['paypal'],
    }));
  }

  private getProvider(name: string): IPaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new BadRequestException(`Unsupported payment provider: ${name}`);
    return provider;
  }

  async createPayment(quoteId: string, providerName: string, paymentType: string, userId: string) {
    const provider = this.getProvider(providerName);
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { consulting: true, payments: true },
    });
    if (!quote) throw new NotFoundException('Quote not found');

    let amount: number;
    let description: string;

    switch (paymentType) {
      case 'CONSULTING':
        if (!quote.consulting) throw new BadRequestException('This quote does not require consulting');
        if (quote.consulting.status !== 'PENDING') throw new BadRequestException('Consulting already paid');
        amount = quote.consulting.totalPrice;
        description = `Consultoría previa - ${quote.reference}`;
        break;
      case 'DEPOSIT':
        amount = quote.depositAmount;
        description = `Anticipo 50% - ${quote.reference}`;
        break;
      case 'FULL':
        amount = quote.totalEstimate - quote.paidAmount;
        description = `Pago completo - ${quote.reference}`;
        break;
      default:
        throw new BadRequestException('Invalid payment type');
    }

    const successUrl = this.configService.get('FRONTEND_URL') + `/presupuesto/${quote.token}?payment=success`;
    const cancelUrl = this.configService.get('FRONTEND_URL') + `/presupuesto/${quote.token}?payment=cancelled`;

    const result = await provider.createCheckoutSession({
      amount,
      currency: quote.currency,
      quoteReference: quote.reference,
      quoteId: quote.id,
      successUrl,
      cancelUrl,
      metadata: { paymentType, userId },
    });

    const paymentRef = `PAY-${quote.reference}-${Date.now()}`;
    await this.prisma.payment.create({
      data: {
        reference: paymentRef,
        amount,
        currency: quote.currency,
        type: paymentType as any,
        provider: providerName,
        providerId: result.providerPaymentId,
        status: 'PENDING',
        quoteId: quote.id,
        metadata: JSON.stringify({ description }),
      },
    });

    return {
      redirectUrl: result.redirectUrl,
      providerPaymentId: result.providerPaymentId,
    };
  }

  async handleWebhook(providerName: string, payload: any, signature: string) {
    const provider = this.getProvider(providerName);
    const isValid = await provider.verifyWebhook(payload, signature);
    if (!isValid) throw new BadRequestException('Invalid webhook signature');

    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

    if (providerName === 'stripe') {
      return this.handleStripeWebhook(event);
    } else if (providerName === 'paypal') {
      return this.handlePayPalWebhook(event);
    }
  }

  private async handleStripeWebhook(event: any) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const quoteId = session.metadata?.quoteId;
      const paymentType = session.metadata?.paymentType;

      if (quoteId && paymentType) {
        await this.updatePaymentStatus(quoteId, session.id, 'COMPLETED', paymentType);
      }
    }
  }

  private async handlePayPalWebhook(event: any) {
    if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = event.resource.id;
      const payment = await this.prisma.payment.findFirst({
        where: { providerId: orderId },
      });
      if (payment) {
        await this.updatePaymentStatus(payment.quoteId, orderId, 'COMPLETED', payment.type);
      }
    }
  }

  private async updatePaymentStatus(quoteId: string, providerId: string, status: string, paymentType: string) {
    const dbStatus = status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
    await this.prisma.payment.updateMany({
      where: { quoteId, providerId },
      data: { status: dbStatus as any },
    });

    if (status === 'COMPLETED') {
      const payment = await this.prisma.payment.findFirst({
        where: { quoteId, providerId },
      });
      if (!payment) return;

      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { paidAmount: { increment: payment.amount } },
      });

      const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });

      if (paymentType === 'CONSULTING') {
        await this.prisma.preConsulting.update({
          where: { quoteId },
          data: { status: 'PAID' },
        });
        await this.updateQuoteStatus(quoteId, 'CONSULTING_PAID');
      } else if (paymentType === 'DEPOSIT') {
        await this.updateQuoteStatus(quoteId, 'DEPOSIT_PAID');
      } else if (paymentType === 'FULL') {
        await this.updateQuoteStatus(quoteId, 'PAID');
      }
    }
  }

  private async updateQuoteStatus(quoteId: string, status: string) {
    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: status as any },
    });
    await this.prisma.quoteStatusLog.create({
      data: { quoteId, status: status as any },
    });
  }
}
