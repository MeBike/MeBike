
"use client";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BikeCard } from "@/components/BikeCard";
import { Calendar, Pencil, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Station } from "@/types/station.type";
import { getStatusColor } from "@/utils/status-style";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import * as tt from "@tomtom-international/web-sdk-maps";



interface StationDetailProps {
  station: Station;
  onSubmit : ({address,capacity,latitude,longitude,name} : {
    address : string,
    capacity : number,
    latitude : string,
    longitude : string,
    name : string
  }) => void;
}

export default function StationDetail({ station, onSubmit }: StationDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<tt.Map | null>(null);
  const markerRef = useRef<tt.Marker | null>(null);
  const [formData, setFormData] = useState({
    name: station?.name || "",
    address: station?.address || "",
    capacity: station?.capacity || 0,
    latitude: station?.latitude || 0,
    longitude: station?.longitude || 0,
  });

  // Effect xử lý bản đồ khi bật chế độ Edit
  useEffect(() => {
    if (!isEditing || !mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    if (!apiKey) return;

    // Khởi tạo map sau một khoảng delay ngắn để đảm bảo DOM đã render
    const timer = setTimeout(() => {
      const lat = parseFloat(formData.latitude.toString());
      const lng = parseFloat(formData.longitude.toString());

      mapInstanceRef.current = tt.map({
        key: apiKey,
        container: mapRef.current!,
        center: [lng, lat],
        zoom: 15,
        style: "https://api.tomtom.com/style/1/style/20.3.2-*?map=basic_main",
      });

      // Thêm marker hiện tại
      markerRef.current = new tt.Marker()
        .setLngLat([lng, lat])
        .addTo(mapInstanceRef.current);

      // Sự kiện click để đổi vị trí
      mapInstanceRef.current.on("click", (e) => {
        const { lat, lng } = e.lngLat;
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        }
      });

      // Resize map để tránh lỗi render hụt
      setTimeout(() => mapInstanceRef.current?.resize(), 200);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isEditing]);

  if (!station) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Station not found</p>
      </div>
    );
  }

  const occupancyRate = Math.round(
    (station.totalBike / station.capacity) * 100
  );

  const handleSave = () => {
    // Gọi API update ở đây (sử dụng formData)
    onSubmit({
      address: formData.address,
      capacity: formData.capacity,
      latitude: formData.latitude.toString(),
      longitude: formData.longitude.toString(),
      name: formData.name,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: station.name,
      address: station.address,
      capacity: station.capacity,
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
        backLink="/admin/stations"
        actions={
          isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="gradient-primary text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </>
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
            <h2 className="text-lg font-semibold text-card-foreground mb-4">
              Station Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name & Status */}
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
                <Badge className={`text-xs ${getStatusColor(station.status)}`}>
                  {station.status}
                </Badge>
              </div>

              {/* Address */}
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

              {/* Capacity & Map Section */}
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Lat"
                    type="number"
                    readOnly={!isEditing}
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
                    readOnly={!isEditing}
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        longitude: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* TomTom Map Integration */}
              {isEditing && (
                <div className="md:col-span-2 space-y-2">
                  <Label>Select Location on Map</Label>
                  <div
                    ref={mapRef}
                    className="w-full h-[300px] rounded-lg border border-border"
                    style={{ backgroundColor: "#e5e7eb" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bikes Section */}
          <div className="rounded-xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-card-foreground mb-4">
              Bikes at this Station ({station.totalBike})
            </h2>
            {station.totalBike > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {station.bikes.map((bike) => (
                  <BikeCard
                    key={bike.id}
                    bike={bike}
                    station_name={station.name}
                  />
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
              {/* Các chỉ số bike... */}
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
              </div>
            </div>
          </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
