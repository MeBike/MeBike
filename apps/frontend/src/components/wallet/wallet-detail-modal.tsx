"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserWallet, DetailWallet } from "@/types/Wallet";

interface WalletDetailModalProps {
  isOpen: boolean;
  user: UserWallet | null;
  onClose: () => void;
  detailTransactions?: DetailWallet[];
}

export function WalletDetailModal({
  isOpen,
  user,
  onClose,
  detailTransactions = [],
}: WalletDetailModalProps) {
  if (!user) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chi tiết ví - {user.fullName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Số dư hiện tại:</p>
            <p className="text-2xl font-bold">
              {user.current_balance.toLocaleString("vi-VN")}₫
            </p>
          </div>
          {
            detailTransactions.length === 0 && (
              <p className="text-center text-muted-foreground">
                Không có giao dịch nào để hiển thị.
              </p>
            )
          }
          {detailTransactions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-3">10 giao dịch gần đây nhất</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {detailTransactions.map((transaction) => (
                  <div key={transaction._id} className="p-4 border rounded-lg bg-muted/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Mô tả:</span>
                          <p className="font-medium">{transaction.description}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Thời gian:</span>
                          <p className="text-sm">{new Date(transaction.created_at).toLocaleString("vi-VN")}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Mã giao dịch:</span>
                          <p className="text-sm font-mono">{transaction.transaction_hash || "N/A"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Số tiền:</span>
                          <p className={`font-semibold text-lg ${transaction.type === "NẠP TIỀN" ? "text-green-600" : "text-red-600"}`}>
                            {transaction.type === "NẠP TIỀN" ? "+" : "-"}
                            {transaction.amount.toLocaleString("vi-VN")}₫
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Phí:</span>
                          <p className="text-sm">{transaction.fee}₫</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                            transaction.status === "THÀNH CÔNG" ? "bg-green-100 text-green-800" :
                            transaction.status === "THẤT BẠI" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}