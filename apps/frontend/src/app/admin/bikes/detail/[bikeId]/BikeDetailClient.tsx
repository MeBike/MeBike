"use client";
import React, { useState } from "react";
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
import { MapPin, Cpu, Calendar, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Bike, DetailBike } from "@/types";
import { Supplier } from "@/types/supplier.type";
import { Station } from "@/types/station.type";

// Cấu hình UI tĩnh giữ nguyên
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
      // Gọi API Update ở đây (nên dùng Server Action hoặc API Route)
      // await updateBike(bike.id, formData);

      setBike({ ...bike, ...formData }); // Update UI tạm thời
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
    <div>
      <PageHeader
        title={bike.chipId}
        description={`Bike ID: ${bike.id}`}
        backLink="/bikes"
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
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Bike Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Chip ID</Label>
                {isEditing ? (
                  <Input
                    value={formData.chipId}
                    onChange={(e) =>
                      setFormData({ ...formData, chipId: e.target.value })
                    }
                  />
                ) : (
                  <p className="font-medium">{bike.chipId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                {isEditing ? (
                  <Select
                    value={formData.status}
                    onValueChange={(v) =>
                      setFormData({ ...formData, status: v as Bike["status"] })
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
                  <Badge
                  // variant={
                  //   statusConfig[bike.status as keyof typeof statusConfig]
                  //     ?.variant
                  // }
                  >
                    {bike.status}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>Station</Label>
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
                  <p className="font-medium">{bike.station?.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Supplier</Label>
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
                  <p className="font-medium">{bike.supplier?.name}</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">
              Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                  <Calendar className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(bike.createdAt).toLocaleString()}
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
                    {new Date(bike.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                <MapPin className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-card-foreground">
                Current Station
              </h3>
            </div>
            <div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">
                  {bike.station.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {bike.station.address}
                </p>
                <Badge
                  variant={
                    bike.station.status === "Active" ? "success" : "secondary"
                  }
                >
                  {bike.station.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent bg-primary/10">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground">Supplier</h3>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">
                {bike.supplier.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {bike.supplier.contactInfo.phone}
              </p>
              <Badge
                variant={
                  bike.supplier.status === "Active" ? "success" : "secondary"
                }
              >
                {bike.supplier.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
