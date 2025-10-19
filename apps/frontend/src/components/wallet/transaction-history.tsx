"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletTransaction } from "@/types/Wallet";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Zap } from "lucide-react";

interface TransactionHistoryProps {
  transactions: WalletTransaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case "withdraw":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case "rental_charge":
        return <Zap className="w-4 h-4 text-blue-500" />;
      case "refund":
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Nạp tiền";
      case "withdraw":
        return "Trừ tiền";
      case "rental_charge":
        return "Phí thuê xe";
      case "refund":
        return "Hoàn tiền";
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "bg-green-100 text-green-800";
      case "withdraw":
        return "bg-red-100 text-red-800";
      case "rental_charge":
        return "bg-blue-100 text-blue-800";
      case "refund":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử giao dịch gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, 10).map((transaction) => (
            <div
              key={transaction._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${transaction.type === "deposit" || transaction.type === "refund" ? "text-green-600" : "text-red-600"}`}
                >
                  {transaction.type === "deposit" ||
                  transaction.type === "refund"
                    ? "+"
                    : "-"}
                  {transaction.amount.toLocaleString("vi-VN")}₫
                </p>
                <Badge className={getTransactionColor(transaction.type)}>
                  {getTransactionLabel(transaction.type)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
