import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bike, CheckCircle, Clock, XCircle } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "rental",
    customer: "Nguyễn Văn A",
    bike: "Xe đạp thể thao #123",
    status: "active",
    time: "10 phút trước",
  },
  {
    id: 2,
    type: "return",
    customer: "Trần Thị B",
    bike: "Xe đạp địa hình #045",
    status: "completed",
    time: "25 phút trước",
  },
  {
    id: 3,
    type: "rental",
    customer: "Lê Văn C",
    bike: "Xe đạp touring #089",
    status: "active",
    time: "1 giờ trước",
  },
  {
    id: 4,
    type: "return",
    customer: "Phạm Thị D",
    bike: "Xe đạp mini #012",
    status: "late",
    time: "2 giờ trước",
  },
];

export function RecentActivity() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="border-primary text-primary">
            <Clock className="w-3 h-3 mr-1" />
            Đang thuê
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="border-accent text-accent">
            <CheckCircle className="w-3 h-3 mr-1" />
            Hoàn thành
          </Badge>
        );
      case "late":
        return (
          <Badge
            variant="outline"
            className="border-destructive text-destructive"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Trễ hạn
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Hoạt động gần đây
          </h3>
          <p className="text-sm text-muted-foreground">
            Các giao dịch mới nhất
          </p>
        </div>

        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bike className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-foreground truncate">
                    {activity.customer}
                  </p>
                  {getStatusBadge(activity.status)}
                </div>
                <p className="text-sm text-muted-foreground">{activity.bike}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
