"use client";

import { Card } from "@/components/ui/card";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface RefundOverview {
  totalRefunds: number;
  totalPendingRefund: number;
  totalCompleteRefund: number;
  totalCompletedRefundAmount: {
    $numberDecimal: string;
  };
  totalApproveRefund: number;
  totalRejectRefund: number;
}

interface RefundStatsProps {
  stats: RefundOverview;
}

export function RefundStats({ stats }: RefundStatsProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: 4 main stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng yêu cầu</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {stats.totalRefunds}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chờ xử lý</p>
              <p className="text-3xl font-bold text-yellow-500 mt-1">
                {stats.totalPendingRefund}
              </p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
              <p className="text-3xl font-bold text-green-500 mt-1">
                {stats.totalCompleteRefund}
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đã duyệt</p>
              <p className="text-3xl font-bold text-blue-500 mt-1">
                {stats.totalApproveRefund}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Rejected + Total Amount */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Bị từ chối</p>
              <p className="text-3xl font-bold text-red-500 mt-1">
                {stats.totalRejectRefund}
              </p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Tổng số tiền đã hoàn
              </p>
              <p className="text-3xl font-bold text-accent mt-1">
                {Number(
                  stats.totalCompletedRefundAmount.$numberDecimal
                ).toLocaleString("vi-VN")}
                {" đ"}
              </p>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg">
              <Wallet className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
