"use client";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStatusColor } from "@/utils/bike-status";
import { formatToVNTime } from "@/lib/formateVNDate";
import { BikeStatus } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Cpu,
  Calendar,
  Pencil,
  Save,
  X,
  History,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Bike, DetailBike } from "@/types";
import { Supplier } from "@/types/supplier.type";
import { Station } from "@/types/station.type";

const statusConfig = {
  available: { variant: "success" as const, label: "Available" },
  booked: { variant: "info" as const, label: "Booked" },
  broken: { variant: "destructive" as const, label: "Broken" },
  reserved: { variant: "warning" as const, label: "Reserved" },
  maintained: { variant: "muted" as const, label: "Maintenance" },
  unavailable: { variant: "secondary" as const, label: "Unavailable" },
};

interface Props {
  initialBike: DetailBike;
  allSuppliers: Supplier[];
  allStations: Station[];
}

export default function BikeDetailClient({
  initialBike,
  allSuppliers,
  allStations,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [bike, setBike] = useState(initialBike);

  const [formData, setFormData] = useState({
    chipId: bike.chipId || "",
    status: bike.status || "available",
    stationId: bike.station?.id || "",
    supplierId: bike.supplier?.id || "",
  });

  const handleSave = async () => {
    try {
      // Logic API call giả định
      setBike({ ...bike, ...formData });
      toast.success("Bike updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update bike");
    }
  };

  const handleCancel = () => {
    setFormData({
      chipId: bike.chipId,
      status: bike.status,
      stationId: bike.station?.id,
      supplierId: bike.supplier?.id,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={bike.chipId}
        description={`Bike ID: ${bike.id}`}
        backLink="/admin/bikes"
        actions={
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="gradient-primary text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-card p-6 shadow-card border border-border/50 h-full">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Info className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">General Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Chip ID</Label>
                {isEditing ? (
                  <Input
                    value={formData.chipId}
                    onChange={(e) =>
                      setFormData({ ...formData, chipId: e.target.value })
                    }
                    className="focus-visible:ring-primary"
                  />
                ) : (
                  <p className="text-xl font-bold tracking-tight text-foreground">
                    {bike.chipId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Current Status</Label>
                <div>
                  {isEditing ? (
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          status: v as Bike["status"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bike.status as BikeStatus)}`}
                    >
                      {bike.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Assigned Station
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.stationId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, stationId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allStations.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      {bike.station?.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Supplier Agency</Label>
                {isEditing ? (
                  <Select
                    value={formData.supplierId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, supplierId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allSuppliers.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id}>
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      {bike.supplier?.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card border border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <MapPin className="h-12 w-12" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground">Location</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-bold text-foreground">{bike.station.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {bike.station.address}
                </p>
              </div>
              <Badge
                variant={
                  bike.station.status === "Active" ? "success" : "secondary"
                }
              >
                {bike.station.status}
              </Badge>
            </div>
          </div>

          {/* Card Supplier */}
          <div className="rounded-xl bg-card p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Cpu className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-card-foreground">Supplier</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-bold text-foreground">
                  {bike.supplier.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {bike.supplier.contactInfo.phone}
                </p>
              </div>
              <Badge
                variant={
                  bike.supplier.status === "Active" ? "success" : "secondary"
                }
              >
                {bike.supplier.status}
              </Badge>
            </div>
          </div>

          {/* Card Timeline - Đưa về đây để lấp đầy khoảng trống dọc */}
          <div className="rounded-xl bg-card p-6 shadow-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-card-foreground">Timeline</h3>
            </div>

            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              <div className="relative pl-10">
                <div className="absolute left-0 p-1 bg-background border-2 border-primary rounded-full z-10">
                  <Calendar className="h-3 w-3 text-primary" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Created
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {formatToVNTime(bike.createdAt)}
                </p>
              </div>

              <div className="relative pl-10">
                <div className="absolute left-0 p-1 bg-background border-2 border-muted-foreground/30 rounded-full z-10">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Last Updated
                </p>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {formatToVNTime(bike.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
