import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BikeStation,  Station } from "@custom-types";
import { Bike, MapPin, Clock, Users } from "lucide-react";
import { toast } from "sonner";

interface BikeStationInfoProps {
  station: Station;
  bikeStation: BikeStation;
  onBack: () => void;
}

export const BikeStationInfo = ({
  station,
  bikeStation,
  onBack,
}: BikeStationInfoProps) => {
  const handleRentBike = () => {
    toast.success("Bạn đã thuê xe thành công!", {
      description: `Mã trạm: ${bikeStation.id}. Vui lòng đến trạm để lấy xe.`,
      duration: 5000,
    });
  };

  const availabilityStatus = () => {
    const ratio = bikeStation.availableBikes / bikeStation.totalBikes;
    if (ratio > 0.7) return { color: "success", text: "Nhiều xe" };
    if (ratio > 0.3) return { color: "warning", text: "Vừa phải" };
    return { color: "destructive", text: "Ít xe" };
  };

  const status = availabilityStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack} className="px-3">
          ← Quay lại
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{station.name}</h2>
          <p className="text-muted-foreground">Trạm MeBike</p>
        </div>
      </div>

      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-primary">
                <Bike className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Trạm xe đạp MeBike</CardTitle>
                <CardDescription>Mã trạm: {bikeStation.id}</CardDescription>
              </div>
            </div>
            <Badge
              variant={
                status.color === "success"
                  ? "default"
                  : status.color === "warning"
                  ? "secondary"
                  : "destructive"
              }
              className="px-3 py-1"
            >
              {status.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-4 rounded-lg bg-accent/20 border border-accent/30">
              <Bike className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-accent-foreground">
                  Xe có sẵn
                </p>
                <p className="text-2xl font-bold text-accent">
                  {bikeStation.availableBikes}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-4 rounded-lg bg-secondary/20 border border-secondary/30">
              <Users className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-sm font-medium text-secondary-foreground">
                  Tổng số xe
                </p>
                <p className="text-2xl font-bold text-secondary">
                  {bikeStation.totalBikes}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                Cách ga metro {bikeStation.distance}m (1-2 phút đi bộ)
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Hoạt động 24/7</span>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              onClick={handleRentBike}
              disabled={bikeStation.availableBikes === 0}
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-3 h-12"
            >
              {bikeStation.availableBikes > 0 ? "Thuê xe ngay" : "Hết xe"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Giá thuê: 10,000đ/giờ đầu, 5,000đ/giờ tiếp theo
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Thông tin ga Metro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{station.description}</p>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{station.address}</span>
          </div>
          <Badge variant="outline" className="text-xs w-fit">
            {station.type}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
