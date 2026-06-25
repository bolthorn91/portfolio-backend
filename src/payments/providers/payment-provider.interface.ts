export interface CreatePaymentResult {
  redirectUrl: string;
  providerPaymentId: string;
}

export interface PaymentResult {
  success: boolean;
  providerPaymentId: string;
  amount: number;
  status: string;
}

export interface IPaymentProvider {
  name: string;
  createCheckoutSession(params: {
    amount: number;
    currency: string;
    quoteReference: string;
    quoteId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<CreatePaymentResult>;
  capturePayment(providerPaymentId: string): Promise<PaymentResult>;
  refundPayment(providerPaymentId: string, amount?: number): Promise<PaymentResult>;
  verifyWebhook(payload: any, signature: string): Promise<boolean>;
}
