"use client";
import { ProfileHeader } from "@/components/dashboard/profile-header";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
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
