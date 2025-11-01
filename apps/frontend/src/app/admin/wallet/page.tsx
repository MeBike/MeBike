"use client";

import { useState } from "react";
import { WalletStats } from "@/components/wallet/wallet-stats";
import { WalletUserList } from "@components/wallet/wallet-user-list";
import { TransactionHistory } from "@components/wallet/transaction-history";
import { WalletTransactionModal } from "@/components/wallet/wallet-transaction-modal";
import { UserWallet, WalletTransaction } from "@/types/Wallet";
import { useWalletActions } from "@/hooks/useWalletAction";
import { walletColumn } from "@/columns/wallet-column";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { Wallet } from "@/services/wallet.service";
const mockUsers: UserWallet[] = [
  {
    _id: "user1",
    userId: "user1",
    fullName: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    avatar: "/diverse-user-avatars.png",
    current_balance: 500000,
    total_spent: 250000,
    total_deposited: 750000,
    last_transaction: "2024-10-19",
  },
  {
    _id: "user2",
    userId: "user2",
    fullName: "Trần Thị B",
    email: "tranthib@example.com",
    avatar: "/diverse-user-avatars.png",
    current_balance: 300000,
    total_spent: 150000,
    total_deposited: 450000,
    last_transaction: "2024-10-18",
  },
  {
    _id: "user3",
    userId: "user3",
    fullName: "Lê Văn C",
    email: "levanc@example.com",
    avatar: "/diverse-user-avatars.png",
    current_balance: 1000000,
    total_spent: 500000,
    total_deposited: 1500000,
    last_transaction: "2024-10-19",
  },
];

const mockTransactions: WalletTransaction[] = [
  {
    _id: "trans1",
    userId: "user1",
    type: "deposit",
    amount: 500000,
    description: "Nạp tiền qua admin",
    balance_before: 0,
    balance_after: 500000,
    created_at: "2024-10-19",
    admin_id: "1",
  },
  {
    _id: "trans2",
    userId: "user2",
    type: "rental_charge",
    amount: 50000,
    description: "Phí thuê xe - Chuyến đi từ Bến Thành đến Tân Bình",
    balance_before: 350000,
    balance_after: 300000,
    created_at: "2024-10-18",
  },
  {
    _id: "trans3",
    userId: "user3",
    type: "withdraw",
    amount: 100000,
    description: "Trừ tiền do vi phạm",
    balance_before: 1100000,
    balance_after: 1000000,
    created_at: "2024-10-19",
    admin_id: "1",
  },
  {
    _id: "trans4",
    userId: "user1",
    type: "refund",
    amount: 25000,
    description: "Hoàn tiền do hủy chuyến",
    balance_before: 475000,
    balance_after: 500000,
    created_at: "2024-10-17",
  },
];

interface TransactionDetails {
  fee?: number;
  description: string;
  transaction_hash?: string;
}

export default function WalletPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserWallet[]>(mockUsers);
  const [transactions, setTransactions] =
    useState<WalletTransaction[]>(mockTransactions);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { allWallets , paginationWallet , debitWallet , topUpWallet} = useWalletActions(true, page, limit);
  const handleDepositOld = (
    userId: string,
    amount: number,
    details: TransactionDetails
  ) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user._id === userId
          ? {
              ...user,
              current_balance: user.current_balance + amount,
              total_deposited: user.total_deposited + amount,
            }
          : user
      )
    );

    const newTransaction: WalletTransaction = {
      _id: `trans${Date.now()}`,
      userId,
      type: "deposit",
      amount,
      fee: details.fee || 0,
      description: details.description,
      transaction_hash: details.transaction_hash,
      balance_before: users.find((u) => u._id === userId)?.current_balance || 0,
      balance_after:
        (users.find((u) => u._id === userId)?.current_balance || 0) + amount,
      created_at: new Date().toISOString(),
      admin_id: "1",
    };

    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const handleWithdrawOld = (
    userId: string,
    amount: number,
    details: TransactionDetails
  ) => {
    const user = users.find((u) => u._id === userId);
    if (user && user.current_balance >= amount) {
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId
            ? {
                ...u,
                current_balance: u.current_balance - amount,
                total_spent: u.total_spent + amount,
              }
            : u
        )
      );

      const newTransaction: WalletTransaction = {
        _id: `trans${Date.now()}`,
        userId,
        type: "withdraw",
        amount,
        fee: details.fee || 0,
        description: details.description,
        transaction_hash: details.transaction_hash,
        balance_before: user.current_balance,
        balance_after: user.current_balance - amount,
        created_at: new Date().toISOString(),
        admin_id: "1",
      };

      setTransactions((prev) => [newTransaction, ...prev]);
    }
  };

  const handleDeposit = (userId: string, amount: number, details: TransactionDetails) => {
    const data = {
      user_id: userId,
      amount,
      fee: details.fee || 0,
      description: details.description,
      message: details.description,
      transaction_hash: details.transaction_hash || '',
    };
    topUpWallet(data);
  };

  const handleWithdraw = (userId: string, amount: number, details: TransactionDetails) => {
    const data = {
      user_id: userId,
      amount,
      fee: details.fee || 0,
      description: details.description,
      message: details.description,
      transaction_hash: details.transaction_hash || '',
    };
    debitWallet(data);
  };

  const handleOpenModal = (wallet: Wallet, actionType: "deposit" | "withdraw") => {
    setSelectedWallet(wallet);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWallet(null);
  };

  const totalBalance = allWallets?.reduce(
    (sum, wallet) => sum + (wallet.balance || 0),
    0
  ) || 0;
  const totalDeposited = 0; // TODO: Get from API
  const totalWithdrawn = 0; // TODO: Get from API

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Quản lý ví người dùng
        </h1>
        <p className="text-muted-foreground mt-2">
          Nạp tiền, trừ tiền và xem lịch sử giao dịch ví của người dùng
        </p>
      </div>

      <WalletStats
        totalBalance={totalBalance}
        totalDeposited={totalDeposited}
        totalWithdrawn={totalWithdrawn}
        transactionCount={allWallets?.length || 0}
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <div>
            <DataTable
              columns={walletColumn({
                onDeposit: ({ id }) => {
                  const wallet = allWallets?.find(w => w._id === id);
                  if (wallet) handleOpenModal(wallet, "deposit");
                },
                onWithdraw: ({ id }) => {
                  const wallet = allWallets?.find(w => w._id === id);
                  if (wallet) handleOpenModal(wallet, "withdraw");
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
        <div>
          <TransactionHistory transactions={transactions} />
        </div>
      </div>

      <WalletTransactionModal
        isOpen={isModalOpen}
        user={selectedWallet ? {
          _id: selectedWallet.user_id,
          userId: selectedWallet.user_id,
          fullName: "User Name", // TODO: Get from API
          email: "user@example.com", // TODO: Get from API
          avatar: "/diverse-user-avatars.png",
          current_balance: selectedWallet.balance,
          total_spent: 0, // TODO: Get from API
          total_deposited: 0, // TODO: Get from API
          last_transaction: new Date().toISOString().split('T')[0],
        } : null}
        onClose={handleCloseModal}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
      />
    </div>
  );
}
