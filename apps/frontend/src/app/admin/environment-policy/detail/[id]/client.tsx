"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, CheckCircle2, Calendar, Gauge, 
  Leaf, Settings2, ShieldCheck, Clock, Activity 
} from "lucide-react";
import { formatToVNTime } from "@/lib/formatVNDate";
import { cn } from "@/lib/utils";
import type { Environment } from "@/types/Environment";

const DetailSection = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
  <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 border-b bg-muted/30 px-5 py-3">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const DetailRow = ({ label, value, unit }: { label: string, value: string | number, unit?: string }) => (
  <div className="flex justify-between items-center py-2 border-b last:border-0 border-dashed">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold flex items-center gap-1">
      {value} <span className="text-[10px] text-muted-foreground font-normal uppercase">{unit}</span>
    </span>
  </div>
);

export default function Client({
  data,
  onActivate,
}: {
  data: Environment;
  onActivate: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleActivate = async () => {
    setIsProcessing(true);
    await onActivate(data.id);
    setIsProcessing(false);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={cn("text-[10px]", data.status === "ACTIVE" ? "bg-green-500" : "bg-yellow-500")}>
                {data.status}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Tạo lúc: {formatToVNTime(data.created_at)}
              </span>
            </div>
          </div>
        </div>
        {data.status === "INACTIVE" && (
          <Button onClick={handleActivate} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700">
            {isProcessing ? "Đang xử lý..." : <><CheckCircle2 className="mr-2 h-4 w-4" /> Kích hoạt chính sách</>}
          </Button>
        )}
      </div>

      {/* Grid nội dung */}
      <div className="grid gap-6 md:grid-cols-2">
        <DetailSection icon={Activity} title="Thông số Vận hành">
          <DetailRow label="Tốc độ trung bình" value={data.average_speed_kmh} unit="km/h" />
          <DetailRow label="CO2 tiết kiệm / km" value={data.co2_saved_per_km} unit={data.co2_saved_per_km_unit} />
        </DetailSection>

        <DetailSection icon={Settings2} title="Cấu hình Công thức">
          <DetailRow label="Phiên bản công thức" value={data.formula_config.formula_version} />
          <DetailRow label="Nguồn dữ liệu" value={data.formula_config.distance_source} />
        </DetailSection>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DetailSection icon={ShieldCheck} title="Tham số Bảo mật & Buffer">
          <DetailRow label="Hệ số tin cậy" value={data.formula_config.confidence_factor} />
          <DetailRow label="Thời gian Scan Buffer" value={data.formula_config.return_scan_buffer_minutes} unit="phút" />
        </DetailSection>

        <DetailSection icon={Leaf} title="Trạng thái Thời gian">
          <DetailRow label="Ngày bắt đầu hiệu lực" value={data.active_from ? formatToVNTime(data.active_from) : "Chưa xác định"} />
          <DetailRow label="Ngày kết thúc" value={data.active_to ? formatToVNTime(data.active_to) : "Vô hạn"} />
        </DetailSection>
      </div>
    </div>
  );
}