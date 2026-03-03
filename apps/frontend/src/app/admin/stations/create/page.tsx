"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/stationSchema";
import { useStationActions } from "@/hooks/use-station";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import { StationMap } from "../components/station-map";
import { StationInfoForm } from "../components/station-infor-form";

export default function CreateStationPage() {
  const router = useRouter();
  const { createStation } = useStationActions({ hasToken: true });

  const form = useForm<StationSchemaFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: { name: "", address: "", latitude: 0, longitude: 0, capacity: 0 },
  });

  const onLocationSelect = (lat: number, lng: number) => {
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
  };

  const onSubmit = async (data: StationSchemaFormData) => {
    const result = await createStation(data);
    if (result?.status === 200) {
      router.push("/admin/stations");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-7xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6 -ml-3 text-muted-foreground hover:text-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-5 w-5" /> Quay lại danh sách
      </Button>

      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Tạo trạm xe mới</h1>
        <p className="text-muted-foreground mt-2 text-lg">Điền thông tin và chọn vị trí trên bản đồ để thêm trạm xe.</p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StationInfoForm 
            form={form} 
            onSubmit={onSubmit} 
            onCancel={() => router.push("/admin/stations")} 
          />
        </div>
        
        <div className="lg:col-span-2 min-h-[500px]">
          <StationMap onLocationSelect={onLocationSelect} />
        </div>
      </form>
    </div>
  );
}