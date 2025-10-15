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
    return (
      <div>
        <Progress />
      </div>
    );
  }
  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        <section>
          <ProfileHeader user={user} />
        </section>

      </div>
    </DashboardLayout>
  );
}
