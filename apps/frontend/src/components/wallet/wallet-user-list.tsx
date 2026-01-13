"use client";
import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { WalletTransactionModal } from "./wallet-transaction-modal";
import { UserWallet } from "@/types/wallet";
interface WalletUserListProps {
  users: UserWallet[];
  onDeposit: (
    userId: string,
    amount: number,
    details: TransactionDetails
  ) => void;
  onWithdraw: (userId: string, amount: number, details: TransactionDetails) => void;
}
interface TransactionDetails {
  fee?: number;
  description: string;
  transaction_hash?: string;
}
export function WalletUserList({
  users,
  onDeposit,
  onWithdraw,
}: WalletUserListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWallet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (user: UserWallet) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách ví người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">
                      Tên người dùng
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-right py-3 px-4 font-medium">
                      Số dư hiện tại
                    </th>
                    <th className="text-right py-3 px-4 font-medium">
                      Tổng chi tiêu
                    </th>
                    <th className="text-center py-3 px-4 font-medium">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Image
                            src={user.avatar || "/placeholder.svg"}
                            alt={user.fullName}
                            className="w-8 h-8 rounded-full"
                            width={32}
                            height={32}
                          />
                          {user.fullName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {user.current_balance.toLocaleString("vi-VN")}₫
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground">
                        {user.total_spent.toLocaleString("vi-VN")}₫
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <Button
                            size="sm"
                            onClick={() => handleOpenModal(user)}
                          >
                            Quản lý
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <WalletTransactionModal
        isOpen={isModalOpen}
        user={selectedUser}
        onClose={handleCloseModal}
        onDeposit={onDeposit}
        onWithdraw={onWithdraw}
      />
    </>
  );
}
