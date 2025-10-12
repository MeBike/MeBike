import { ProfileHeader } from "@/components/dashboard/profile-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RentalChart } from "@/components/dashboard/rental-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import type { User as DetailUser } from "@custom-types";
import { Bike, TrendingUp, Users, DollarSign } from "lucide-react";

// Mock data - thay thế bằng dữ liệu thực từ API
const mockUser: DetailUser = {
  _id: "507f1f77bcf86cd799439011",
  fullname: "Nguyễn Văn Minh",
  email: "minh.nguyen@bikerental.vn",
  verify: "verified",
  location: "Hà Nội, Việt Nam",
  username: "minh_staff",
  phone_number: "+84 912 345 678",
  avatar: "/professional-avatar.png",
  role: "STAFF",
  created_at: "2024-01-15T08:30:00Z",
  updated_at: "2025-01-06T10:20:00Z",
  password: "",
  email_verify_token: "",
  forgot_verify_token: "",
};

export default function DashboardPage() {
  return (
    <DashboardLayout user={mockUser}>
      <div className="space-y-8">
        {/* Profile Section */}
        <section>
          <ProfileHeader user={mockUser} />
        </section>

        {/* Stats Section */}
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

        {/* Charts and Activity Section */}
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
