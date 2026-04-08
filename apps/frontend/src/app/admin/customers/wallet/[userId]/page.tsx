"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useUserActions } from "@/hooks/use-user";
import { useWalletActions } from "@/hooks/use-wallet";
import CustomerWalletDetail from "./CustomerWalletDetail";

export default function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = React.use(params);
  const [transactionPage, setTransactionPage] = useState(1);
  const transactionPageSize = 10;

  const { detailUserData, isLoadingDetailUser } = useUserActions({
    hasToken: true,
    id: userId,
  });

  const {
    allWallets,
    manageTransactions,
    isLoadingTransactions,
    isLoadingWallet,
  } = useWalletActions({
    hasToken: true,
    userId,
    walletPage: 1,
    walletPageSize: 10,
    transactionPage,
    transactionPageSize,
  });

  if (isLoadingDetailUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!detailUserData?.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  return (
    <CustomerWalletDetail
      user={detailUserData.data}
      allWallets={allWallets}
      manageTransactions={manageTransactions}
      isLoadingWallet={isLoadingWallet}
      isLoadingTransactions={isLoadingTransactions}
      transactionPage={transactionPage}
      onTransactionPageChange={setTransactionPage}
    />
  );
}
