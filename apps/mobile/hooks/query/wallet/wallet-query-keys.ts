export const walletQueryKeys = {
  myWallet: (scope: string | null | undefined) => ["my-wallet", scope ?? "guest"] as const,
  myTransactions: (scope: string | null | undefined) => ["myTransactions", scope ?? "guest"] as const,
};
