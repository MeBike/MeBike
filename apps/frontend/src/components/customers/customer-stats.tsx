"use client";

import { Card } from "@/components/ui/card";
import { Users, UserCheck, TrendingUp, DollarSign, Award } from "lucide-react";
import { DashboardUserStats } from "@/services/user.service";

export function CustomerStats({ stats }: { stats: DashboardUserStats })  {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tổng khách hàng</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {stats.totalCustomers}
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {stats.activeCustomers}
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <UserCheck className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Khách mới tháng này</p>
            <p className="text-3xl font-bold text-blue-500 mt-1">
              {stats.newCustomersThisMonth || 0}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Khách VIP</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">
              {stats.vipCustomer ? stats.vipCustomer.fullname : "N/A"}
            </p>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <Award className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Tổng doanh thu từ khách hàng
            </p>
            <p className="text-3xl font-bold text-accent mt-1">
              {stats.totalRevenue || 0}
            </p>
          </div>
          <div className="p-3 bg-accent/10 rounded-lg">
            <DollarSign className="w-6 h-6 text-accent" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Chi tiêu trung bình/khách
            </p>
            <p className="text-3xl font-bold text-purple-500 mt-1">
              {stats.averageSpending || 0}
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}
