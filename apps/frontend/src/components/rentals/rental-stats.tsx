"use client";

import { Card } from "@/components/ui/card";
import {
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { SummaryRental } from "@custom-types";
import { formatCurrency } from "@/utils/formatCurrency";

export function RentalStats({ params }: { params: SummaryRental }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Thẻ Đang thuê */}
      <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Đang thuê</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">
              {params.rentalList.Rented}
            </p>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
      </Card>

      {/* Thẻ Hoàn thành */}
      <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Hoàn thành</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {params.rentalList.Completed}
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </Card>
      
      {/* Thẻ Doanh thu hôm nay */}
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Doanh thu hôm nay</p>
            <p className="text-3xl font-bold text-primary mt-1 tracking-tight">
              {formatCurrency(params.dailyRevenue.current)}
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Card>

      {/* Thẻ Tổng doanh thu tháng này */}
      <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Tổng doanh thu tháng này
            </p>
            <p className="text-3xl font-bold text-accent mt-1 tracking-tight">
              {formatCurrency(params.monthlyRevenue.current)}
            </p>
          </div>
          <div className="p-3 bg-accent/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-accent" />
          </div>
        </div>
      </Card>
    </div>
  );
}