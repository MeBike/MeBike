"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { WalletStats } from "@/components/wallet/wallet-stats";
import { WalletUserList } from "@components/wallet/wallet-user-list";
import { TransactionHistory } from "@components/wallet/transaction-history";
import type { DetailUser } from "@/services/auth.service";
import { UserWallet, WalletTransaction } from "@/types/Wallet";
// Mock data
const mockUser: DetailUser = {
  _id: "1",
  fullname: "Admin User",
  email: "admin@metrobike.com",
  verify: "verified",
  location: "TP.HCM",
  username: "admin",
  phone_number: "0901234567",
  avatar: "/admin-avatar.png",
  role: "ADMIN",
  created_at: "2024-01-01",
  updated_at: "2024-10-19",
};

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
  const [users, setUsers] = useState<UserWallet[]>(mockUsers);
  const [transactions, setTransactions] =
    useState<WalletTransaction[]>(mockTransactions);

  const handleDeposit = (
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

  const handleWithdraw = (
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

  const totalBalance = users.reduce(
    (sum, user) => sum + user.current_balance,
    0
  );
  const totalDeposited = users.reduce(
    (sum, user) => sum + user.total_deposited,
    0
  );
  const totalWithdrawn = transactions
    .filter((t) => t.type === "withdraw")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout user={mockUser}>
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
          transactionCount={transactions.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WalletUserList
              users={users}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
            />
          </div>
          <div>
            <TransactionHistory transactions={transactions} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
