"use client";

import React, { useState, useEffect } from "react";
import { useUserActions } from "@/hooks/use-user";
import { useWalletActions } from "@/hooks/use-wallet";
import CustomerWalletDetail from "./CustomerWalletDetail";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
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
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingDetailUser && isLoadingTransactions && isLoadingWallet) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingDetailUser,isLoadingTransactions,isLoadingWallet]);
  if (!detailUserData) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin ví người dùng.
        </p>
      </div>
    );
  }
  if (isVisualLoading) {
      return <LoadingScreen />;
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
