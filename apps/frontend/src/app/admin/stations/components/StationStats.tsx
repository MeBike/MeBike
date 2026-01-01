import { Card } from "@/components/ui/card";
import { MapPin  } from "lucide-react";
interface StationStatsProps {
    totalStation: number;
    activeStation: number;
    inActiveStation: number;
}
export default function StationStats({ totalStation , activeStation , inActiveStation }: StationStatsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Station</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {totalStation}
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Card>
      <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Active Station</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {activeStation}
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <MapPin className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </Card>
      <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Inactive Station</p>
            <p className="text-3xl font-bold text-red-500 mt-1">
              {inActiveStation}
            </p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg">
            <MapPin className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </Card>
      </div>
  );
}
