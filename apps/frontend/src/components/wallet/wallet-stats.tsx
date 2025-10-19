"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface WalletStatsProps {
  totalBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  transactionCount: number;
}

export function WalletStats({
  totalBalance,
  totalDeposited,
  totalWithdrawn,
  transactionCount,
}: WalletStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng số dư ví</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalBalance.toLocaleString("vi-VN")}₫
          </div>
          <p className="text-xs text-muted-foreground">Tất cả user</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng nạp tiền</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {totalDeposited.toLocaleString("vi-VN")}₫
          </div>
          <p className="text-xs text-muted-foreground">Trong hệ thống</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng trừ tiền</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {totalWithdrawn.toLocaleString("vi-VN")}₫
          </div>
          <p className="text-xs text-muted-foreground">Đã trừ</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Số giao dịch</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{transactionCount}</div>
          <p className="text-xs text-muted-foreground">Tổng cộng</p>
        </CardContent>
      </Card>
    </div>
  );
}
