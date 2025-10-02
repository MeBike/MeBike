import { Injectable } from '@nestjs/common';
import { PaymentStrategy } from 'src/strategies/payment-strategy.interface';
import { VnpayStrategy } from 'src/strategies/vnpay.strategy';
import { ZaloPayStrategy } from 'src/strategies/zalopay.stategy';

@Injectable()
export class PaymentService {
  private strategy: Record<string, PaymentStrategy> = {
    vnpay: new VnpayStrategy(),
    zalopay: new ZaloPayStrategy(),
  };

  async createPayment(
    method: 'vnpay' | 'zalopay',
    orderId: string,
    amount: number,
  ) {
    return this.strategy[method].pay(orderId, amount);
  }

  async handleCallback(method: 'vnpay' | 'zalopay', data: any) {
    return this.strategy[method].handleCallback(data);
  }
}
