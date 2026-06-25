import { Controller, Post, Get, Body, Param, UseGuards, Req, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('providers')
  getProviders() {
    return this.paymentsService.getAvailableProviders();
  }

  @Post('create/:quoteId/:provider')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Param('quoteId') quoteId: string,
    @Param('provider') provider: string,
    @Body('paymentType') paymentType: string,
    @Req() req: any,
  ) {
    return this.paymentsService.createPayment(quoteId, provider, paymentType, req.user.id);
  }

  @Post('webhook/stripe')
  async stripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook('stripe', req.body, signature);
  }

  @Post('webhook/paypal')
  async paypalWebhook(
    @Req() req: any,
    @Headers('paypal-transmission-id') signature: string,
  ) {
    return this.paymentsService.handleWebhook('paypal', req.body, signature);
  }
}
