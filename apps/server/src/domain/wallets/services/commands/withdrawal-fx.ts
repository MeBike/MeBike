export const VND_PER_USD = 26000n;

/**
 * Quy đổi VND minor unit sang USD minor unit cho Stripe payout provider.
 *
 * @param amountVnd Số tiền VND theo minor unit nội bộ.
 * @returns Số tiền USD theo minor unit, hoặc null nếu amount không hợp lệ/quá nhỏ.
 */
export function convertVndToUsdMinor(amountVnd: bigint): bigint | null {
  if (amountVnd <= 0n) {
    return null;
  }

  const payoutAmount = (amountVnd * 100n) / VND_PER_USD;
  return payoutAmount > 0n ? payoutAmount : null;
}
