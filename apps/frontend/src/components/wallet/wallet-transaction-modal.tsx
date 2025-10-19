"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, X } from "lucide-react";
import type { UserWallet } from "@/types/Wallet";
interface WalletTransactionModalProps {
  isOpen: boolean;
  user: UserWallet | null;
  onClose: () => void;
  onDeposit: (
    userId: string,
    amount: number,
    details: TransactionDetails
  ) => void;
  onWithdraw: (
    userId: string,
    amount: number,
    details: TransactionDetails
  ) => void;
}

interface TransactionDetails {
  fee?: number;
  description: string;
  transaction_hash?: string;
}
export function WalletTransactionModal({
  isOpen,
  user,
  onClose,
  onDeposit,
  onWithdraw,
}: WalletTransactionModalProps) {
  const [actionType, setActionType] = useState<"deposit" | "withdraw" | null>(
    null
  );
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [description, setDescription] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  const handleSubmit = () => {
    if (!user || !amount || Number.parseFloat(amount) <= 0) return;

    const details = {
      fee: fee ? Number.parseFloat(fee) : 0,
      description:
        description ||
        (actionType === "deposit"
          ? "Nạp tiền qua admin"
          : "Trừ tiền qua admin"),
      transaction_hash: transactionHash,
    };

    if (actionType === "deposit") {
      onDeposit(user._id, Number.parseFloat(amount), details);
    } else if (actionType === "withdraw") {
      onWithdraw(user._id, Number.parseFloat(amount), details);
    }

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setActionType(null);
    setAmount("");
    setFee("");
    setDescription("");
    setTransactionHash("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quản lý ví - {user.fullName}</DialogTitle>
        </DialogHeader>

        {!actionType ? (
          <div className="space-y-3 py-4">
            <div className="bg-muted p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">Số dư hiện tại:</p>
              <p className="text-2xl font-bold">
                {user.current_balance.toLocaleString("vi-VN")}₫
              </p>
            </div>

            <Button
              onClick={() => setActionType("deposit")}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nạp tiền vào ví
            </Button>

            <Button
              onClick={() => setActionType("withdraw")}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <Minus className="w-4 h-4 mr-2" />
              Trừ tiền từ ví
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {actionType === "deposit"
                  ? "Nạp tiền vào ví"
                  : "Trừ tiền từ ví"}
              </h3>
              <button
                onClick={() => setActionType(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Số tiền *</label>
              <Input
                type="number"
                placeholder="Nhập số tiền"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Phí</label>
              <Input
                type="number"
                placeholder="Nhập phí (nếu có)"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                min="0"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Mô tả</label>
              <Input
                type="text"
                placeholder="Nhập mô tả giao dịch"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Mã giao dịch</label>
              <Input
                type="text"
                placeholder="Nhập mã giao dịch (transaction hash)"
                value={transactionHash}
                onChange={(e) => setTransactionHash(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setActionType(null)}>
                Quay lại
              </Button>
              <Button
                onClick={handleSubmit}
                className={
                  actionType === "deposit"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {actionType === "deposit" ? "Nạp tiền" : "Trừ tiền"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
