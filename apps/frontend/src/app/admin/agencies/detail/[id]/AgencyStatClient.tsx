"use client";

import { useEffect, useState } from "react";
import { getStatusColor } from "@/columns/agency-column";
import { useRouter } from "next/navigation";
import { 
  Settings2, Edit3, Loader2, Users, MapPin, Bike, 
  TrendingUp, AlertTriangle, Calendar, DollarSign, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, 
  LucideIcon , ArrowLeft
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import type { AgencyStats , AgencyStatus } from "@custom-types";
import { updateSchema, updateAgencyStatusSchema, UpdateAgencyFormData, UpdateAgencyStatusFormData } from "@/schemas";

const SectionCard = ({ icon: Icon, title, children }: {icon:LucideIcon,title:string,children:React.ReactNode}) => (
  <div className="rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col shadow-sm">
    <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4 bg-muted/20">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-sm font-semibold uppercase">{title}</h2>
    </div>
    <div className="p-5 flex-1">{children}</div>
  </div>
);

const StatRow = ({ label, value, color }: {label:string,value:React.ReactNode,color?:string}) => (
  <div className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={cn("text-sm font-bold", color)}>{value}</span>
  </div>
);

export function AgencyStatsView({ stats, onUpdateInfo, onUpdateStatus }: { 
  stats: AgencyStats; 
  onUpdateInfo: (data: UpdateAgencyFormData) => Promise<void>;
  onUpdateStatus: (data: UpdateAgencyStatusFormData) => Promise<void>;
}) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { agency, period, operators, currentStation, pickups, returns, incidents } = stats;
  const infoForm = useForm<UpdateAgencyFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: { name: agency.name, contactPhone: agency.contactPhone || "" },
  });

  const statusForm = useForm<UpdateAgencyStatusFormData>({
    resolver: zodResolver(updateAgencyStatusSchema),
    defaultValues: { status: agency.status as AgencyStatus },
  });
  useEffect(() => {
    infoForm.reset({ name: agency.name, contactPhone: agency.contactPhone || "" });
    statusForm.reset({ status: agency.status as AgencyStatus });
  }, [agency, infoForm, statusForm]);
  const handleAction = async (task: () => Promise<void>, close: () => void) => {
    setIsSubmitting(true);
    try {
      await task();
      close();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="-m-6 min-h-[calc(100vh-5rem)] bg-slate-50 p-6 dark:bg-background">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">
              Chi tiết Agency
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/agencies")}
          >
            Danh sách Agency
          </Button>
        </div>
            <div className="space-y-6">
      
      <div className="flex flex-col gap-4 rounded-xl border border-primary/20 bg-white p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{agency.name}</h1>
            <Badge className={`${getStatusColor(agency.status as AgencyStatus)}`}>{agency.status}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Kỳ: {formatToVNTime(period.from)}</span>
            <span>SĐT: {agency.contactPhone}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm">Trạng thái</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cập nhật trạng thái</DialogTitle></DialogHeader>
              <Form {...statusForm}>
                <form onSubmit={statusForm.handleSubmit(d => handleAction(() => onUpdateStatus(d), () => setIsStatusOpen(false)))} className="space-y-4">
                  <FormField control={statusForm.control} name="status" render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {["ACTIVE", "INACTIVE", "SUSPENDED", "BANNED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Info Dialog */}
          <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <DialogTrigger asChild><Button size="sm">Chỉnh sửa</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Thông tin Agency</DialogTitle></DialogHeader>
              <Form {...infoForm}>
                <form onSubmit={infoForm.handleSubmit(d => handleAction(() => onUpdateInfo(d), () => setIsInfoOpen(false)))} className="space-y-4">
                  <FormField control={infoForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Tên</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={infoForm.control} name="contactPhone" render={({ field }) => (
                    <FormItem><FormLabel>SĐT</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Cập nhật</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SectionCard icon={DollarSign} title="Tài chính">
          <p className="text-2xl font-bold text-primary">{pickups.totalRevenue.toLocaleString()}đ</p>
          <div className="mt-4 space-y-2">
            <StatRow label="Hoàn tất" value={pickups.completedRentals} />
            <StatRow label="TB phút" value={pickups.avgDurationMinutes} />
          </div>
        </SectionCard>

        <SectionCard icon={MapPin} title="Trạm xe">
          <p className="text-2xl font-bold">{(currentStation.occupancyRate * 100).toFixed(1)}%</p>
          <div className="mt-4 space-y-2">
            <StatRow label="Tổng xe" value={currentStation.totalBikes} />
            <StatRow label="Ô trống" value={currentStation.emptySlots} />
          </div>
        </SectionCard>

        <SectionCard icon={Users} title="Nhân sự">
          <StatRow label="Tổng số" value={operators.totalOperators} />
          <StatRow label="Hoạt động" value={operators.activeOperators} color="text-green-600" />
        </SectionCard>

        <SectionCard icon={AlertTriangle} title="Sự cố">
          <StatRow label="Tổng số" value={incidents.totalIncidentsInPeriod} />
          <StatRow label="Chưa xử lý" value={incidents.openIncidents} color="text-destructive" />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={Bike} title="Chi tiết xe tại trạm">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg"><p className="text-xs text-muted-foreground">Sẵn sàng</p><p className="text-xl font-bold text-green-700">{currentStation.availableBikes}</p></div>
            <div className="p-3 bg-amber-50 rounded-lg"><p className="text-xs text-muted-foreground">Đặt trước</p><p className="text-xl font-bold text-amber-700">{currentStation.bookedBikes}</p></div>
            <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-muted-foreground">Đang hỏng</p><p className="text-xl font-bold text-red-700">{currentStation.brokenBikes}</p></div>
            <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-muted-foreground">Bảo trì</p><p className="text-xl font-bold text-blue-700">{currentStation.maintainedBikes}</p></div>
          </div>
        </SectionCard>

        <SectionCard icon={TrendingUp} title="Dòng luân chuyển">
          <div className="flex justify-around border-b pb-4 mb-4">
            <div className="text-center"><ArrowUpRight className="text-green-500 mx-auto" /><p className="text-xl font-bold">{pickups.totalRentals}</p><p className="text-[10px] text-muted-foreground">LƯỢT THUÊ</p></div>
            <div className="text-center"><ArrowDownRight className="text-blue-500 mx-auto" /><p className="text-xl font-bold">{returns.totalReturns}</p><p className="text-[10px] text-muted-foreground">LƯỢT TRẢ</p></div>
          </div>
          <StatRow label="Đang di chuyển" value={pickups.activeRentals} />
          <StatRow label="Xác nhận trả" value={returns.agencyConfirmedReturns} />
        </SectionCard>
      </div>
    </div>
      </div>
    </div>
  );
}