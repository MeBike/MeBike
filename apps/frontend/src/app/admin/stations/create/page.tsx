"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/stationSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import * as tt from "@tomtom-international/web-sdk-maps";
import { useStationActions } from "@/hooks/use-station";

export default function CreateStationPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<tt.Map | null>(null);

  const { createStation } = useStationActions({ hasToken: true });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StationSchemaFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: "",
      address: "",
      latitude: 0,
      longitude: 0,
      capacity: 0,
    },
  });

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    if (!apiKey) return;

    const timer = setTimeout(() => {
      mapInstanceRef.current = tt.map({
        key: apiKey,
        container: mapRef.current as HTMLElement,
        center: [106.70098, 10.77689],
        zoom: 14,
        style: "https://api.tomtom.com/style/1/style/20.3.2-*?map=hybrid_main",
      });

      setTimeout(() => {
        mapInstanceRef.current?.resize();
      }, 300);

      const markerRef = { current: null as tt.Marker | null };
      mapInstanceRef.current.on("click", function (e) {
        const { lat, lng } = e.lngLat;
        setValue("latitude", lat);
        setValue("longitude", lng);

        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          markerRef.current = new tt.Marker({ draggable: false })
            .setLngLat([lng, lat])
            .addTo(mapInstanceRef.current!);
        }
      });
    }, 400);

    return () => {
      clearTimeout(timer);
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [setValue]);

  const onSubmit = async (data: StationSchemaFormData) => {
    const result = await createStation(data);
    if (result?.status === 200) {
      reset();
      router.push("/admin/stations");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-background/95 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-8 -ml-3 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Quay lại danh sách trạm
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tạo trạm xe mới</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Thêm một trạm xe đạp mới vào hệ thống quản lý
          </p>
        </div>

        {/* Main Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-lg border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/30 px-6 py-5">
                <h2 className="text-lg font-semibold text-foreground">Thông tin trạm</h2>
              </div>

              <div className="px-6 py-6 space-y-5">
                {/* Tên trạm */}
                <FormField label="Tên trạm" required>
                  <Input 
                    type="text" 
                    {...register("name")} 
                    placeholder="Nhập tên trạm"
                    className={`h-11 text-base ${errors.name ? "border-red-500 bg-red-50/30" : ""}`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-2">{errors.name.message}</p>
                  )}
                </FormField>

                {/* Địa chỉ */}
                <FormField label="Địa chỉ" required>
                  <Input
                    type="text"
                    {...register("address")}
                    placeholder="Nhập địa chỉ trạm"
                    className={`h-11 text-base ${errors.address ? "border-red-500 bg-red-50/30" : ""}`}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 mt-2">{errors.address.message}</p>
                  )}
                </FormField>

                {/* Sức chứa */}
                <FormField label="Sức chứa (số xe)" required>
                  <Input
                    type="number"
                    {...register("capacity", { valueAsNumber: true })}
                    placeholder="Nhập sức chứa"
                    className={`h-11 text-base ${errors.capacity ? "border-red-500 bg-red-50/30" : ""}`}
                  />
                  {errors.capacity && (
                    <p className="text-sm text-red-500 mt-2">{errors.capacity.message}</p>
                  )}
                </FormField>

                {/* Tọa độ */}
                <div className="border-t border-border pt-5">
                  <p className="text-sm font-semibold text-foreground mb-4">Tọa độ vị trí</p>
                  
                  <div className="space-y-4">
                    <FormField label="Latitude">
                      <Input 
                        type="text" 
                        {...register("latitude")} 
                        readOnly
                        className="h-11 text-base bg-muted/50 cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Nhấp trên bản đồ để chọn vị trí</p>
                    </FormField>

                    <FormField label="Longitude">
                      <Input 
                        type="text" 
                        {...register("longitude")} 
                        readOnly
                        className="h-11 text-base bg-muted/50 cursor-not-allowed"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/stations")}
                    className="h-11 flex-1"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    className="h-11 flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang lưu..." : "Tạo trạm"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden h-full">
              <div className="border-b border-border bg-muted/30 px-6 py-5">
                <h2 className="text-lg font-semibold text-foreground">Chọn vị trí trên bản đồ</h2>
                <p className="text-sm text-muted-foreground mt-1">Nhấp trên bản đồ để xác định tọa độ của trạm</p>
              </div>

              <div
                ref={mapRef}
                className="w-full"
                style={{
                  height: "500px",
                  backgroundColor: "#e5e7eb",
                }}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Form Field Component
function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm font-semibold text-foreground mb-2 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

