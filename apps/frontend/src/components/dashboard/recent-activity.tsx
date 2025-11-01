import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useUserActions } from "@/hooks/useUserAction";
import { useRentalsActions } from "@/hooks/useRentalAction";

export function RecentActivity() {
  const { topRenter } = useUserActions({ hasToken: true });
  const { dashboardSummaryData } = useRentalsActions({ hasToken: true });
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Top người thuê xe
          </h3>
          <p className="text-sm text-muted-foreground">
            Người dùng có số lượt thuê cao nhất
          </p>
        </div>

        <div className="space-y-4">
          {topRenter?.slice(0, 5).map((renter, index) => (
            <div
              key={renter.user._id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-foreground truncate">
                    {renter.user.fullname}
                  </p>
                  <Badge variant="outline" className="border-primary text-primary">
                    #{index + 1}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {renter.total_rentals} lượt thuê
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {renter.user.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
