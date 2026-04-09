"use client";
import { useEffect } from "react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RentalChart } from "@/components/dashboard/rental-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Bike, TrendingUp, Users, DollarSign } from "lucide-react";
import { useAuth } from "@/providers/auth-providers";
import { Progress } from "@/components/ui/progress";
import { useUserActions } from "@/hooks/use-user";
import { useBikeActions } from "@/hooks/use-bike";
import { useRentalsActions } from "@/hooks/use-rental";
import { formatRevenue } from "@/lib/formatVND";
export default function DashboardPage() {
  const { user } = useAuth();
  const { newRegistrationStats, getNewRegistrationStats } = useUserActions({
    hasToken: true,
  }); 
  const { statusCount, totalRecord , getStatisticsBike} = useBikeActions({hasToken:true});
  const { dashboardSummaryData, getDashboardSummary , getSummaryRental , summaryRental } = useRentalsActions({
    hasToken: true,
  });
  useEffect(() => {
    getDashboardSummary();
  }, [getDashboardSummary]);
  useEffect(() => {
    getStatisticsBike();
  }, [getStatisticsBike]);
  useEffect(() => {
    getNewRegistrationStats();
  }, [getNewRegistrationStats]);
  useEffect(() => {
    getSummaryRental();
  }, [getSummaryRental]);
  const changePercentBike = statusCount?.AVAILABLE
    ? Math.round((statusCount.AVAILABLE / totalRecord || 1) * 100)
    : 0;
  
  // const formattedValue =
  //   monthlyRev && Number(monthlyRev) >= 1000000
  //     ? `${(monthlyRev / 1000000).toFixed(1)}M VND`
  //     : `${monthlyRev.toLocaleString('vi-VN')} VND`;

  const changeRentPercent = dashboardSummaryData?.revenueSummary.today.totalRentals && dashboardSummaryData?.revenueSummary.yesterday.totalRentals
    ? Math.round(
        ((dashboardSummaryData.revenueSummary.today.totalRentals - dashboardSummaryData.revenueSummary.yesterday.totalRentals) /
          dashboardSummaryData.revenueSummary.yesterday.totalRentals) *
          100
      )
    : 0;
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
              value={
                dashboardSummaryData
                  ? dashboardSummaryData.revenueSummary.today.totalRentals.toString()
                  : "0"
              }
              change={`${changeRentPercent}% so với hôm qua`}
              changeType={changeRentPercent > 1 ? "positive" : "negative"}
              icon={Bike}
            />
            <StatsCard
              title="Xe đang cho thuê"
              value={
                statusCount
                  ? statusCount.UNAVAILABLE?.toString()
                  : "0"
              }
              change={`${
                changePercentBike > 1 ? "+" : ""
              }${changePercentBike}% so với tháng trước`}
              changeType={changePercentBike > 1 ? "positive" : "negative"}
              icon={TrendingUp}
            />
            <StatsCard
              title="Khách hàng mới trong tháng"
              value={
                newRegistrationStats
                  ? newRegistrationStats.newUsersThisMonth.toString()
                  : "0"
              }
              change={`${
                (newRegistrationStats?.percentageChange ?? 0) > 1 ? "+" : ""
              }${newRegistrationStats?.percentageChange ?? 0}% so với tháng trước`}
              changeType={(newRegistrationStats?.percentageChange ?? 0) > 1 ? "positive" : "negative"}
              icon={Users}
            />
            <StatsCard
              title="Doanh thu tháng này"
              value={formatRevenue(
                summaryRental?.monthlyRevenue.current
              )}
              icon={DollarSign}
              change={`${
                (summaryRental?.monthlyRevenue?.percentChange ?? 0) > 1 ? "+" : ""
              }${summaryRental?.monthlyRevenue?.percentChange ?? 0}% so với tháng trước`}
              changeType={(summaryRental?.monthlyRevenue?.percentChange ?? 0) > 1 ? "positive" : "negative"}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RentalChart
              data={
                dashboardSummaryData?.hourlyRentalStats.map(
                  (stat: { hour: string; totalRentals: number }) => ({
                    time: stat.hour,
                    rentals: stat.totalRentals,
                  })
                ) || []
              }
            />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>
        </section>
      </div>
    </div>
  );
}

