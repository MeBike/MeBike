"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as tt from "@tomtom-international/web-sdk-maps";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStationActions } from "@/hooks/use-station";
import { stationSchema, StationSchemaFormData } from "@/schemas/stationSchema";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
interface CreateStationPageProps {
  onCreate : (data: StationSchemaFormData) => Promise<void>;
}
export default function CreateStationPage({ onCreate }: CreateStationPageProps) {
  const router = useRouter();
  const {createStation} = useStationActions({hasToken: true});
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<tt.Marker | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StationSchemaFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      capacity: 0,
    },
  });

  // Khởi tạo bản đồ khi vào trang
  useEffect(() => {
    if (!mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    if (!apiKey) return;

    mapInstanceRef.current = tt.map({
      key: apiKey,
      container: mapRef.current,
      center: [106.70098, 10.77689],
      zoom: 14,
      style: "https://api.tomtom.com/style/1/style/20.3.2-*?map=hybrid_main",
    });

    mapInstanceRef.current.addControl(new tt.NavigationControl());

    mapInstanceRef.current.on("click", (e: any) => {
      const { lat, lng } = e.lngLat;
      setValue("latitude", lat.toString());
      setValue("longitude", lng.toString());

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new tt.Marker()
          .setLngLat([lng, lat])
          .addTo(mapInstanceRef.current);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [setValue]);

  const onSubmit = async (data: StationSchemaFormData) => {
    try {
      await onCreate(data);
      router.push("/admin/stations"); // Quay lại danh sách sau khi tạo thành công
      router.refresh();
    } catch (error) {
      console.error("Lỗi khi tạo trạm:", error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header trang */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Thêm trạm xe mới</h1>
          <p className="text-sm text-muted-foreground">
            Thiết lập thông tin và vị trí trạm trên bản đồ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái: Form thông tin */}
        <div className="lg:col-span-5 bg-card border rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Tên trạm</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Nhập tên trạm..."
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Nhập địa chỉ chi tiết..."
              />
              {errors.address && (
                <p className="text-xs text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vĩ độ (Lat)</Label>
                <Input
                  {...register("latitude")}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Kinh độ (Lng)</Label>
                <Input
                  {...register("longitude")}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Sức chứa (Xe)</Label>
              <Input
                id="capacity"
                type="number"
                {...register("capacity", { valueAsNumber: true })}
              />
              {errors.capacity && (
                <p className="text-xs text-destructive">
                  {errors.capacity.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Xác nhận thêm trạm"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Hủy bỏ
              </Button>
            </div>
          </form>
        </div>

        {/* Cột phải: Bản đồ */}
        <div className="lg:col-span-7 h-[600px] border rounded-xl overflow-hidden shadow-sm relative">
          <div ref={mapRef} className="w-full h-full" />
          <div className="absolute top-4 left-4 bg-background/90 px-3 py-1.5 rounded-md text-xs font-medium border shadow-sm pointer-events-none">
            Click vào bản đồ để chọn vị trí trạm
          </div>
        </div>
      </div>
    </div>
  );
}
