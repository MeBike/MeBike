export interface PaymentStrategy {
  pay(orderId: string, amount: number): Promise<{ redirectUrl: string }>;
  handleCallback(
    data: any,
  ): Promise<{ orderId: string; status: 'success' | 'failed' }>;
}
