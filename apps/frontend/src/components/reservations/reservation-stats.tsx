"use client";

import { Card } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, DollarSign } from "lucide-react";
import type { ReservationOverview } from "@/types/Reservation";

export function ReservationStats({
  overview,
}: {
  overview: ReservationOverview;
}) {
  const total =
    overview.reservationList.Cancelled +
    overview.reservationList.Expired +
    overview.reservationList.Fulfilled +
    overview.reservationList.Pending;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tổng đặt trước</p>
            <p className="text-3xl font-bold text-primary mt-1">{total}</p>
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
              {overview.reservationList.Fulfilled}
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </Card>
      <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Đang trong phiên thuê
            </p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {overview.reservationList.Pending}
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </Card>
      <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Đã hủy</p>
            <p className="text-3xl font-bold text-red-500 mt-1">
              {overview.reservationList.Cancelled}
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
            <p className="text-sm text-muted-foreground">Hết hạn</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">
              {overview.reservationList.Expired}
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
