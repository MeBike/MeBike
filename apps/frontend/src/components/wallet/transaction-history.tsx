"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ManageTransactionsResponse } from "@/services/wallet.service";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Zap } from "lucide-react";
interface TransactionHistoryProps {
  transactions: ManageTransactionsResponse[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "NẠP TIỀN":
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case "RÚT TIỀN":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case "CỘNG TIỀN":
        return <Zap className="w-4 h-4 text-blue-500" />;
      case "HOÀN TIỀN":
        return <RefreshCw className="w-4 h-4 text-purple-500" />;
      case "ĐẶT TRUỚC":
        return <ArrowUpRight className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "NẠP TIỀN":
        return "Nạp tiền";
      case "RÚT TIỀN":
        return "Rút tiền";
      case "CỘNG TIỀN":
        return "Cộng tiền";
      case "HOÀN TIỀN":
        return "Hoàn tiền";
      case "ĐẶT TRƯỚC":
        return "Đặt trước";
      default:
        return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "NẠP TIỀN":
        return "bg-green-100 text-green-800";
      case "RÚT TIỀN":
        return "bg-red-100 text-red-800";
      case "CỘNG TIỀN":
        return "bg-blue-100 text-blue-800";
      case "HOÀN TIỀN":
        return "bg-purple-100 text-purple-800";
      case "ĐẶT TRƯỚC":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-full">
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
                  <p className="font-medium">
                    {transaction.description.replace(/ \([^)]*[a-f0-9]{24}[^)]*\)$/, "").replace(/ [a-f0-9]{24}$/, "")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${transaction.type === "NẠP TIỀN" || transaction.type === "HOÀN TIỀN" || transaction.type === "CỘNG TIỀN" ? "text-green-600" : "text-red-600"}`}
                >
                  {transaction.type === "NẠP TIỀN" ||
                  transaction.type === "HOÀN TIỀN" ||
                  transaction.type === "CỘNG TIỀN"
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
