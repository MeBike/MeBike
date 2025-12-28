import { Bike, BikeStatus } from "@/types";
import { MapPin, Cpu, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getStatusColor } from "@/utils/bike-status";
interface BikeCardProps {
  bike: Bike;
  station_name: string;
}

export function BikeCard({ bike, station_name }: BikeCardProps) {
  return (
    <Link href={`/admin/bikes/detail/${bike.id}`} className="group block">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-card p-5 shadow-card transition-all duration-300",
          "hover:shadow-card-hover hover:-translate-y-1",
          "animate-fade-in"
        )}
      >
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-1 transition-all duration-300",
            bike.status === "Available" && "bg-green-500",
            bike.status === "Booked" && "bg-blue-500",
            bike.status === "Broken" && "bg-red-500",
            bike.status === "Reserved" && "bg-yellow-400",
            bike.status === "Maintained" && "bg-gray-400",
            bike.status === "Unavailable" && "bg-gray-600"
          )}
        />
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {bike.chipId}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                ID: {bike.id}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bike.status as BikeStatus)}`}
            >
              {bike.status}
            </span>
          </div>

          {/* Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="truncate">{station_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="truncate">{bike.supplier.name}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{new Date(bike.updatedAt).toLocaleDateString()}</span>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View Details <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
