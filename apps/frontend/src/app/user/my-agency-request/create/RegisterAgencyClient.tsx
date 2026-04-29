"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Navigation, User, Building2, Warehouse, Send } from "lucide-react";
import { useAgencyActions } from "@/hooks/use-agency";
import { registerToAgencySchema, RegisterAgencyFormData } from "@/schemas";
import dynamic from "next/dynamic";

const StationMapDynamic = dynamic(
  () => import("@/app/admin/stations/components/station-map").then((mod) => mod.StationMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] bg-muted/50 animate-pulse flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p className="text-sm">Đang khởi tạo bản đồ TomTom...</p>
      </div>
    )
  }
);

export default function RegisterAgencyClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerAgencyRequest } = useAgencyActions({ hasToken: true });

  const form = useForm<RegisterAgencyFormData>({
    resolver: zodResolver(registerToAgencySchema),
    defaultValues: {
      requesterEmail: "",
      requesterPhone: "",
      agencyName: "",
      agencyAddress: "",
      agencyContactPhone: "",
      stationName: "",
      stationAddress: "",
      stationTotalCapacity: 1,
      stationReturnSlotLimit: 1,
      stationLatitude: 10.7626, 
      stationLongitude: 106.6601,
      description: "",
    },
  });

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    form.setValue("stationLatitude", lat, { shouldValidate: true });
    form.setValue("stationLongitude", lng, { shouldValidate: true });
  }, [form]);

  const onSubmit = async (values: RegisterAgencyFormData) => {
    setIsSubmitting(true);
    try {
      await registerAgencyRequest({ data: values });
      toast.success("Gửi yêu cầu đăng ký thành công!");
      form.reset(); 
      router.refresh();
      router.push("/user/my-agency-request")
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold uppercase tracking-widest text-primary">Đăng ký đối tác Agency</h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-12">
          
          <div className="lg:col-span-5 space-y-6">
            {/* Thông tin liên hệ */}
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="bg-muted/30 py-3 border-b"><CardTitle className="text-xs font-bold uppercase flex items-center gap-2"><User className="h-4 w-4"/> Thông tin liên hệ</CardTitle></CardHeader>
              <CardContent className="pt-4 grid grid-cols-2 gap-4">
                <FormField control={form.control} name="requesterEmail" render={({ field }) => (<FormItem className="col-span-1"><FormLabel className="text-[10px] uppercase font-bold">Email</FormLabel><FormControl><Input placeholder="abc@gmail.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="requesterPhone" render={({ field }) => (<FormItem className="col-span-1"><FormLabel className="text-[10px] uppercase font-bold">SĐT cá nhân</FormLabel><FormControl><Input placeholder="09xxxxxxxx" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            {/* Thông tin Agency */}
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="bg-muted/30 py-3 border-b"><CardTitle className="text-xs font-bold uppercase flex items-center gap-2"><Building2 className="h-4 w-4"/> Thông tin doanh nghiệp</CardTitle></CardHeader>
              <CardContent className="pt-4 space-y-4">
                <FormField control={form.control} name="agencyName" render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">Tên Agency</FormLabel><FormControl><Input placeholder="Tên công ty/Cửa hàng" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="agencyAddress" render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">Địa chỉ Agency</FormLabel><FormControl><Input placeholder="Địa chỉ..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="agencyContactPhone" render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">SĐT kinh doanh</FormLabel><FormControl><Input placeholder="028xxxxxxx" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </CardContent>
            </Card>

            {/* Thông tin Trạm */}
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="bg-muted/30 py-3 border-b"><CardTitle className="text-xs font-bold uppercase flex items-center gap-2"><Warehouse className="h-4 w-4"/> Thông tin trạm xe</CardTitle></CardHeader>
              <CardContent className="pt-4 space-y-4">
                <FormField control={form.control} name="stationName" render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">Tên trạm</FormLabel><FormControl><Input placeholder="VD: Trạm MeBike A" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="stationTotalCapacity" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] uppercase font-bold">Tổng sức chứa</FormLabel>
                      <FormControl><Input type="number" {...field} min={1} max={40}  step={1} onChange={e => field.onChange(e.target.value === "" ? 0 : parseInt(e.target.value, 10))} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="stationReturnSlotLimit" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] uppercase font-bold">Giới hạn trả xe</FormLabel>
                      <FormControl><Input type="number" {...field} min={1} max={40} step={1} onChange={e => field.onChange(e.target.value === "" ? 0 : parseInt(e.target.value, 10))} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="stationAddress" render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">Địa chỉ trạm</FormLabel><FormControl><Input placeholder="Địa chỉ thực tế..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Button type="submit" className="w-full h-14 text-lg font-bold shadow-xl" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <><Send className="mr-2 h-5 w-5"/> Gửi yêu cầu</>}
            </Button>
          </div>

          <div className="lg:col-span-7">
            <Card className="h-full min-h-[700px] flex flex-col overflow-hidden border-primary/10 shadow-md">
              <CardHeader className="py-3 bg-muted/20 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase flex items-center gap-2"><Navigation className="h-4 w-4 text-primary" /> Vị trí tọa độ</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">Lat: {form.watch("stationLatitude").toFixed(5)}</Badge>
                  <Badge variant="secondary" className="font-mono text-[10px]">Lng: {form.watch("stationLongitude").toFixed(5)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1"><StationMapDynamic onLocationSelect={handleLocationSelect} /></CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}