"use client";
import { ProfileHeader } from "@/components/dashboard/profile-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RentalChart } from "@/components/dashboard/rental-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Bike, TrendingUp, Users, DollarSign } from "lucide-react";
import { useAuth } from "@/providers/auth-providers";
import { Progress } from "@/components/ui/progress";
export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) {
    return <div><Progress /></div>;
  }
  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        <section>
          <ProfileHeader user={user} />
        </section>
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
              value="45"
              change="68% tổng số xe"
              changeType="neutral"
              icon={TrendingUp}
            />
            <StatsCard
              title="Khách hàng mới"
              value="23"
              change="+8% tuần này"
              changeType="positive"
              icon={Users}
            />
            <StatsCard
              title="Doanh thu hôm nay"
              value="12.5M ₫"
              change="+15% so với hôm qua"
              changeType="positive"
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
    </DashboardLayout>
  );
}
