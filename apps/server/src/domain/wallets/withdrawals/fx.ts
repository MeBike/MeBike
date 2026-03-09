export const VND_PER_USD = 26000n;

export function convertVndToUsdMinor(amountVnd: bigint): bigint | null {
  if (amountVnd <= 0n) {
    return null;
  }

  const payoutAmount = (amountVnd * 100n) / VND_PER_USD;
  return payoutAmount > 0n ? payoutAmount : null;
}
