"use client";

import { Card } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, DollarSign, TrendingUp } from "lucide-react";
import type { ReservationStats } from "@/types/Reservation";

export function ReservationStats({ stats }: { stats: ReservationStats[] }) {
  const totalReservations = stats.reduce((sum, item) => sum + item.total_reservations, 0);
  const totalSuccess = stats.reduce((sum, item) => sum + item.success_count, 0);
  const totalCancelled = stats.reduce((sum, item) => sum + item.cancelled_count, 0);
  const totalRevenue = stats.reduce((sum, item) => sum + item.total_prepaid_revenue, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tổng đặt trước</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {totalReservations}
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Thành công</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {totalSuccess}
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Đã hủy</p>
            <p className="text-3xl font-bold text-red-500 mt-1">
              {totalCancelled}
            </p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Doanh thu đặt cọc</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">
              {totalRevenue.toLocaleString("vi-VN")} VND
            </p>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <DollarSign className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}