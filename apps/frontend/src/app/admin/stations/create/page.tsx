"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/stationSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Thêm trạm mới</h1>
          <p className="text-muted-foreground mt-1">
            Tạo mới trạm xe đạp trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Quay lại
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 max-w-2xl">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tên trạm
            </label>
            <Input type="text" {...register("name")} placeholder="Nhập tên trạm" />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Địa chỉ
            </label>
            <Input
              type="text"
              {...register("address")}
              placeholder="Nhập địa chỉ trạm"
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">
                {errors.address.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Chọn vị trí trên bản đồ
            </label>
            <div
              ref={mapRef}
              style={{
                width: "100%",
                height: "300px",
                backgroundColor: "#e5e7eb",
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Latitude
              </label>
              <Input type="text" {...register("latitude")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Longitude
              </label>
              <Input type="text" {...register("longitude")} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Sức chứa (số xe)
            </label>
            <Input
  type="number"
  {...register("capacity", { valueAsNumber: true })}
  placeholder="Nhập sức chứa"
/>
            {errors.capacity && (
              <p className="text-sm text-red-500 mt-1">
                {errors.capacity.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/stations")}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              Thêm trạm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

