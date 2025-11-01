"use client";

import { useState, useEffect } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TopUpSchemaFormData, topUpWalletSchema, DecreaseSchemaFormData, decreaseWalletSchema } from "@/schemas/walletSchema";
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
  message?: string;
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TopUpSchemaFormData | DecreaseSchemaFormData>({
    resolver: zodResolver(actionType === "deposit" ? topUpWalletSchema : decreaseWalletSchema),
    defaultValues: {
      user_id: user?._id || "",
      amount: 0,
      fee: 0,
      description: "",
      message: "",
      transaction_hash: "",
    },
  });

  // Cập nhật form khi user thay đổi
  useEffect(() => {
    if (user?._id) {
      reset({
        user_id: user._id,
        amount: 0,
        fee: 0,
        description: "",
        message: "",
        transaction_hash: "",
      });
    }
  }, [user?._id, reset, actionType]);
  const onSubmit = (data: TopUpSchemaFormData | DecreaseSchemaFormData) => {
    console.log(data);
    if (!data.amount || data.amount <= 0 || !actionType) return;
    const details = {
      fee: data.fee || 0,
      description:
        data.description ||
        (actionType === "deposit"
          ? "Nạp tiền qua admin"
          : "Trừ tiền qua admin"),
      message: data.message || "",
      transaction_hash: actionType === "deposit" ? (data as TopUpSchemaFormData).transaction_hash : undefined,
    };
    console.log(data);
    if (actionType === "deposit") {
      onDeposit(data.user_id, data.amount, details);
    } else if (actionType === "withdraw") {
      onWithdraw(data.user_id, data.amount, details);
    }
    reset(); // reset form fields
    setActionType(null); // reset view
    onClose();
  };

  const resetForm = () => {
    setActionType(null);
    reset();
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                <label className="text-sm font-medium">User ID</label>
                <Input
                  type="text"
                  placeholder="Nhập User ID"
                  {...register("user_id")}
                  disabled
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Số tiền *</label>
                <Input
                  type="number"
                  placeholder="Nhập số tiền"
                  {...register("amount", { valueAsNumber: true })}
                  min="0"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium">Phí</label>
                <Input
                  type="number"
                  placeholder="Nhập phí (nếu có)"
                  {...register("fee", { valueAsNumber: true })}
                  min="0"
                />
              </div>
              {errors.fee && (
                <p className="text-sm text-red-600">{errors.fee.message}</p>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium">Mô tả</label>
                <Input
                  type="text"
                  placeholder="Nhập mô tả giao dịch"
                  {...register("description")}
                />
              </div>
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium">Lời nhắn</label>
                <Input
                  type="text"
                  placeholder="Nhập lời nhắn (nếu có)"
                  {...register("message")}
                />
              </div>
              {errors.message && (
                <p className="text-sm text-red-600">{errors.message.message}</p>
              )}
              {actionType === "deposit" && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Mã giao dịch (tùy chọn)
                    </label>
                    <Input
                      type="text"
                      placeholder="Nhập mã giao dịch (transaction hash)"
                      {...register("transaction_hash")}
                    />
                  </div>
                  {errors.transaction_hash && (
                    <p className="text-sm text-red-600">
                      {errors.transaction_hash.message}
                    </p>
                  )}
                </>
              )}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setActionType(null)}>
                  Quay lại
                </Button>
                <Button
                  type="submit"
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
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
