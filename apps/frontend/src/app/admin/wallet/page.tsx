"use client";

import { useEffect, useState } from "react";
import { WalletStats } from "@/components/wallet/wallet-stats";
import { TransactionHistory } from "@components/wallet/transaction-history";
import { WalletTransactionModal } from "@/components/wallet/wallet-transaction-modal";
import { WalletDetailModal } from "@/components/wallet/wallet-detail-modal";
import { useWalletActions } from "@/hooks/use-wallet";
import { walletColumn } from "@/columns/wallet-column";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { Wallet } from "@/types/wallet";
import { Loader2 } from "lucide-react";
interface TransactionDetails {
  fee?: number;
  description: string;
  transaction_hash?: string;
}

export default function WalletPage() {
   const [page, setPage] = useState(1);
   const [limit] = useState(8);
   const [searchTerm, setSearchTerm] = useState("");
   const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
   const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
   const {
     allWallets,
     paginationWallet,
     debitWallet,
     topUpWallet,
     manageTransactions,
     walletOverview,
     detailWallet,
     isLoadingDetailWallet,
     updateStatusWallet,
     getWalletOverview,
   } = useWalletActions(true, page, limit, selectedUserId);
  useEffect(() => { 
    getWalletOverview();
  }, [getWalletOverview]);
  const handleDeposit = (
    userId: string,
    amount: number,
    details: TransactionDetails
  ) => {
    const data = {
      user_id: userId,
      amount,
      fee: details.fee || 0,
      description: details.description,
      message: details.description,
      transaction_hash: details.transaction_hash || "",
    };
    topUpWallet(data);
  };

  const handleWithdraw = (
    userId: string,
    amount: number,
    details: TransactionDetails
  ) => {
    const data = {
      user_id: userId,
      amount,
      fee: details.fee || 0,
      description: details.description,
      message: details.description,
    };
    debitWallet(data);
  };

  const handleOpenModal = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setSelectedUserId(wallet.user_id);
    setIsModalOpen(true);
  };

  const handleOpenDetailModal = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setSelectedUserId(wallet.user_id);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWallet(null);
    setSelectedUserId(undefined);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedWallet(null);
    setSelectedUserId(undefined);
  };
  if (isLoadingDetailWallet) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  if(allWallets.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  return (
    <div className="w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Quản lý ví người dùng
        </h1>
        <p className="text-muted-foreground mt-2">
          Nạp tiền, trừ tiền và xem lịch sử giao dịch ví của người dùng
        </p>
      </div>

      <WalletStats
        totalBalance={
          Number(walletOverview?.result.totalBalance.$numberDecimal) || 0
        }
        totalDeposited={
          Number(walletOverview?.result.totalDeposit.$numberDecimal) || 0
        }
        totalWithdrawn={
          Number(walletOverview?.result.totalDecrease.$numberDecimal) || 0
        }
        transactionCount={Number(walletOverview?.result.totalTransactions) || 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        <div className="lg:col-span-2 xl:col-span-3 overflow-x-auto">
          <div className="min-w-full">
            <DataTable
              columns={walletColumn({
                onView: ({ id }) => {
                  const wallet = allWallets?.find((w) => w.id === id);
                  if (wallet) handleOpenDetailModal(wallet);
                },
                onDeposit: ({ id }) => {
                  const wallet = allWallets?.find((w) => w.id === id);
                  if (wallet) handleOpenModal(wallet);
                },
                onEdit: ({ id }) => {
                  const wallet = allWallets?.find((w) => w.id === id);
                  if (wallet) {
                    // Toggle status - try with "KHÓA" if backend expects it
                    const newStatus: "ACTIVE" | "INACTIVE" = 
                      wallet.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                    console.log("🔄 Updating wallet status:", { id, newStatus, currentStatus: wallet.status });
                    updateStatusWallet(newStatus, id);
                  }
                },
              })}
              data={allWallets || []}
              title="Danh sách ví của người dùng"
              filterPlaceholder="Tìm kiếm theo mã ví hoặc mã người dùng..."
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
          <div className="pt-3">
            <PaginationDemo
              currentPage={paginationWallet?.currentPage || 1}
              totalPages={paginationWallet?.totalPages || 1}
              onPageChange={(page) => setPage(page)}
            />
          </div>
        </div>
        <div className="lg:col-span-1">
          <TransactionHistory transactions={manageTransactions?.data || []} />
        </div>
      </div>

      <WalletTransactionModal
        isOpen={isModalOpen}
        user={
          selectedWallet
            ? {
                _id: selectedWallet.user_id,
                userId: selectedWallet.user_id,
                fullName: "User Name",
                email: "user@example.com",
                avatar: "/diverse-user-avatars.png",
                current_balance: selectedWallet.balance,
                total_spent: 0,
                total_deposited: 0,
                last_transaction: new Date().toISOString().split("T")[0],
              }
            : null
        }
        onClose={handleCloseModal}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
      />

      <WalletDetailModal
        isOpen={isDetailModalOpen}
        user={
          selectedWallet
            ? {
                _id: selectedWallet.user_id,
                userId: selectedWallet.user_id,
                fullName: "User Name",
                email: "user@example.com",
                avatar: "/diverse-user-avatars.png",
                current_balance: selectedWallet.balance,
                total_spent: 0,
                total_deposited: 0,
                last_transaction: new Date().toISOString().split("T")[0],
              }
            : null
        }
        onClose={handleCloseDetailModal}
        detailTransactions={detailWallet?.data || []}
      />
      </div>
    </div>
  );
}
