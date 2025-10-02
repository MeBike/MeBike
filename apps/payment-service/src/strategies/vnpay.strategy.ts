import { PaymentStrategy } from './payment-strategy.interface';

export class VnpayStrategy implements PaymentStrategy {
  async pay(orderId: string, amount: number): Promise<{ redirectUrl: string }> {
    // Gọi API hoặc tự build URL cho VNPay
    const redirectUrl = `https://vnpay.vn/pay?order=${orderId}&amount=${amount}`;
    return { redirectUrl };
  }

  async handleCallback(
    data: any,
  ): Promise<{ orderId: string; status: 'success' | 'failed' }> {
    return {
      orderId: data.orderId,
      status: data.code === '00' ? 'success' : 'failed',
    };
  }
}
