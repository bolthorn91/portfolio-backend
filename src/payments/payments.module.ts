import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeProvider } from './providers/stripe.provider';
import { PayPalProvider } from './providers/paypal.provider';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeProvider, PayPalProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
