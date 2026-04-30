"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/station-schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Info, Activity, LayoutGrid, Users,
  Clock, Bike, CheckCircle2, AlertTriangle, Wrench, Ban, LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Station } from "@/types";

// --- REUSABLE COMPONENTS ---
function SectionCard({ icon: Icon, title, children, className }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode; className?: string; }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm", className)}>
      <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function StatusItem({ icon: Icon, label, value, color }: { icon: LucideIcon, label: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className={cn("font-bold", color)}>{value}</span>
    </div>
  );
}

function ErrorMsg({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] font-medium text-destructive">{message}</p>;
}

// --- MAIN COMPONENT ---
interface StationDetailClientProps {
  id: string;
  station: Station;
  isLoading: boolean;
  onUpdateStation: (data: StationSchemaFormData) => Promise<boolean>;
}

export default function StationDetailClient({ id, station, isLoading, onUpdateStation }: StationDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<StationSchemaFormData>({
    resolver: zodResolver(stationSchema),
  });

  if (isLoading || !station) return <Skeleton className="h-96 w-full" />;

  const handleEdit = () => {
    reset({
      name: station.name,
      address: station.address,
      latitude: station.location.latitude,
      longitude: station.location.longitude,
      totalCapacity: station.capacity.total,
      stationType: station.stationType,
      returnSlotLimit: station.capacity.returnSlotLimit
    });
    setIsEditing(true);
  };

  const onSave = async (data: StationSchemaFormData) => {
    if (await onUpdateStation(data)) setIsEditing(false);
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/stations")}><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-2xl font-bold">{isEditing ? "Chỉnh sửa trạm" : "Chi tiết trạm"}</h1>
          </div>
          <div className="flex gap-2">
            {isEditing && (
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Hủy</Button>
            )}
            <Button onClick={isEditing ? handleSubmit(onSave) : handleEdit} disabled={isSubmitting}>
              {isEditing ? (isSubmitting ? "Đang lưu..." : "Lưu thay đổi") : "Chỉnh sửa"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SectionCard icon={Info} title="Thông tin quản lý">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold">TÊN TRẠM</label>
                    <Input {...register("name")} className={cn(errors.name && "border-destructive focus-visible:ring-destructive")} />
                    <ErrorMsg message={errors.name?.message} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold">LOẠI TRẠM</label>
                    <select 
                      {...register("stationType")} 
                      className={cn("w-full h-10 border rounded-md px-2 text-sm", errors.stationType && "border-destructive")}
                    >
                      <option value="INTERNAL">INTERNAL</option>
                      <option value="AGENCY">AGENCY</option>
                    </select>
                    <ErrorMsg message={errors.stationType?.message} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold">ĐỊA CHỈ</label>
                    <Input {...register("address")} className={cn(errors.address && "border-destructive focus-visible:ring-destructive")} />
                    <ErrorMsg message={errors.address?.message} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <Field label="Tên trạm" value={station.name} />
                  <Field label="Loại trạm" value={station.stationType} />
                  <Field label="Địa chỉ" value={station.address} className="col-span-2" />
                </div>
              )}
            </SectionCard>

            <SectionCard icon={Users} title="Nhân viên phụ trách">
              {station.workers?.length > 0 ? (
                <div className="space-y-3">
                  {station.workers.map((w) => (
                    <div key={w.userId} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">{w.fullName.charAt(0)}</div>
                        <div><p className="text-sm font-bold">{w.fullName}</p><p className="text-[10px] text-muted-foreground">{w.role}</p></div>
                      </div>
                      {w.technicianTeamId && <Badge variant="secondary">{w.technicianTeamName || "No Team"}</Badge>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Không có nhân viên.</p>}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard icon={LayoutGrid} title="Cấu hình sức chứa">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold">TỔNG SLOTS</label>
                    <Input type="number" {...register("totalCapacity", { valueAsNumber: true })} className={cn(errors.totalCapacity && "border-destructive")} />
                    <ErrorMsg message={errors.totalCapacity?.message} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold">TRẢ TỐI ĐA</label>
                    <Input type="number" {...register("returnSlotLimit", { valueAsNumber: true })} className={cn(errors.returnSlotLimit && "border-destructive")} />
                    <ErrorMsg message={errors.returnSlotLimit?.message} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 text-center rounded-lg"><p className="text-[10px]">TỔNG SLOTS</p><p className="text-lg font-bold">{station.capacity.total}</p></div>
                  <div className="bg-primary/10 p-3 text-center rounded-lg text-primary"><p className="text-[10px]">TRẢ TỐI ĐA</p><p className="text-lg font-bold">{station.capacity.returnSlotLimit}</p></div>
                </div>
              )}
            </SectionCard>
            
            <SectionCard icon={Activity} title="Thống kê xe tại trạm">
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-5 text-center"><p className="text-xs font-medium text-muted-foreground uppercase">Tổng số xe</p><p className="mt-1 text-4xl font-bold text-primary">{station.bikes.total}</p></div>
                <div className="space-y-2.5 pt-2">
                  <StatusItem icon={CheckCircle2} label="Sẵn sàng" value={station.bikes.available} color="text-green-600" />
                  <StatusItem icon={Clock} label="Đang đặt trước" value={station.bikes.reserved} color="text-amber-600" />
                  <StatusItem icon={Bike} label="Đang thuê" value={station.bikes.booked} color="text-blue-600" />
                  <StatusItem icon={Wrench} label="Xe được điều phối" value={station.bikes.redistributing} color="text-orange-500" />
                  <StatusItem icon={AlertTriangle} label="Xe hỏng" value={station.bikes.broken} color="text-red-500" />
                  <StatusItem icon={Ban} label="Xe tạm ngưng hoạt động" value={station.bikes.disabled} color="text-muted-foreground" />
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}