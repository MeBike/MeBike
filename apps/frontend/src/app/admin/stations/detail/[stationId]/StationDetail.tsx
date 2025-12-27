import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BikeCard } from "@/components/BikeCard";
import { MapPin, Calendar, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Station } from "@/types/station.type";
const statusConfig = {
  active: { variant: "success" as const, label: "Active" },
  inactive: { variant: "secondary" as const, label: "Inactive" },
  maintenance: { variant: "warning" as const, label: "Maintenance" },
};
interface StationDetailProps {
    station : Station;
}
export default function StationDetail({ station }: StationDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  console.log("Station detail:", station);
  const [formData, setFormData] = useState({
    name: station?.name || "",
    address: station?.address || "",
    capacity: station?.capacity || 0,
    status: station?.status || "active",
    latitude: station?.latitude || 0,
    longitude: station?.longitude || 0,
  });

  if (!station) {
    return (
      <div>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Station not found</p>
        </div>
      </div>
    );
  }
  const occupancyRate = Math.round(
    (station.totalBike / station.capacity) * 100
  );

  const handleSave = () => {
    toast.success("Station updated successfully!");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: station.name,
      address: station.address,
      capacity: station.capacity,
      status: station.status,
      latitude: station.latitude,
      longitude: station.longitude,
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={station.name}
        description={station.address}
        backLink="/stations"
        actions={
          isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="gradient-primary text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">
              Station Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-foreground font-medium">{station.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                {isEditing ? (
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as any })
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  //   <Badge variant={status.variant}>{status.label}</Badge>
                  <p>{station.status}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                ) : (
                  <p className="text-foreground font-medium">
                    {station.address}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                {isEditing ? (
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value),
                      })
                    }
                  />
                ) : (
                  <p className="text-foreground font-medium">
                    {station.capacity} bikes
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Coordinates</Label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Lat"
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          latitude: parseFloat(e.target.value),
                        })
                      }
                    />
                    <Input
                      placeholder="Long"
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          longitude: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                ) : (
                  <p className="text-foreground font-medium">
                    {station.latitude}, {station.longitude}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">
                Bikes at this Station ({station.totalBike})
              </h2>
            </div>
            {station.totalBike > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {station.bikes.map((bike) => (
                  <BikeCard key={bike.id} bike={bike} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No bikes at this station
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h3 className="font-semibold text-card-foreground mb-4">
              Capacity Overview
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-medium">{occupancyRate}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      occupancyRate > 80
                        ? "bg-success"
                        : occupancyRate > 50
                          ? "bg-info"
                          : "bg-warning"
                    )}
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-3 rounded-lg bg-success/10">
                  <p className="text-2xl font-bold text-success">
                    {station.availableBike}
                  </p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-info/10">
                  <p className="text-2xl font-bold text-info">
                    {station.bookedBike}
                  </p>
                  <p className="text-xs text-muted-foreground">Booked</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/10">
                  <p className="text-2xl font-bold text-destructive">
                    {station.brokenBike}
                  </p>
                  <p className="text-xs text-muted-foreground">Broken</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-warning/10">
                  <p className="text-2xl font-bold text-warning">
                    {station.maintanedBike}
                  </p>
                  <p className="text-xs text-muted-foreground">Maintenance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h3 className="font-semibold text-card-foreground mb-4">
              Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                  <Calendar className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(station.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(station.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
