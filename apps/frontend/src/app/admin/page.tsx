"use client";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RentalChart } from "@/components/dashboard/rental-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Bike, TrendingUp, Users, DollarSign } from "lucide-react";
import { useAuth } from "@/providers/auth-providers";
import { Progress } from "@/components/ui/progress";
import { useUserActions } from "@/hooks/useUserAction";
import { useBikeActions } from "@/hooks/useBikeAction";
import { useGetRevenueQuery } from "@/hooks/query/Rent/useGetRevenueQuery";
export default function DashboardPage() {
  const { user } = useAuth();
  const {activeUser , getActiveUser , newRegistrationStats } = useUserActions({hasToken:true}); 
  const { statisticData } = useBikeActions(true);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const { data: monthlyRevenue } = useGetRevenueQuery({
    from: startOfMonth.toISOString().split('T')[0],
    to: endOfMonth.toISOString().split('T')[0],
    groupBy: "MONTH"
  });
  const { data: lastMonthlyRevenue } = useGetRevenueQuery({
    from: startOfLastMonth.toISOString().split('T')[0],
    to: endOfLastMonth.toISOString().split('T')[0],
    groupBy: "MONTH"
  });
  const monthlyRev = monthlyRevenue?.data[0]?.totalRevenue || 0;
  const lastMonthlyRev = lastMonthlyRevenue?.data[0]?.totalRevenue || 0;
  const changePercent = lastMonthlyRev ? Math.round((monthlyRev - lastMonthlyRev) / lastMonthlyRev * 100) : 0;
  const changeType = changePercent > 0 ? "positive" : changePercent < 0 ? "negative" : "neutral";
  const formattedValue = monthlyRev ? `${(monthlyRev / 1000000).toFixed(1)}M ₫` : "0 ₫";
  if (!user) {
    return (
      <div>
        <Progress />
      </div>
    );
  }
  return (
    <div>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Thống kê tổng quan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Tổng lượt thuê hôm nay"
              value="127"
              change="+12% so với hôm qua"
              changeType="positive"
              icon={Bike}
            />
            <StatsCard
              title="Xe đang cho thuê"
              value={statisticData ? statisticData.result["ĐANG ĐƯỢC THUÊ"].toString() : "0"}
              change="68% tổng số xe"
              changeType="neutral"
              icon={TrendingUp}
            />
            <StatsCard
              title="Khách hàng mới trong tháng"
              value={
                newRegistrationStats
                  ? newRegistrationStats.result.newUsersThisMonth.toString()
                  : "0"
              }
              change="+8% tuần này"
              changeType="positive"
              icon={Users}
            />
            {/* <StatsCard
              title="Khách hàng mới tháng trước"
              value={
                newRegistrationStats
                  ? newRegistrationStats.result.newUsersLastMonth.toString()
                  : "0"
              }
              change="+8% tuần này"
              changeType="positive"
              icon={Users}
            /> */}
            <StatsCard
              title="Doanh thu tháng này"
              value={formattedValue}
              change={`${changePercent > 0 ? '+' : ''}${changePercent}% so với tháng trước`}
              changeType={changeType}
              icon={DollarSign}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RentalChart />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </section>
      </div>
    </div>
  );
}
