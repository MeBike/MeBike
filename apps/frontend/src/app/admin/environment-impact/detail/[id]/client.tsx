"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Calendar, Leaf, Settings2, 
  Clock, Activity, Calculator, User, Car
} from "lucide-react";
import { formatToVNTime } from "@/lib/formatVNDate";
import type { Co2Record } from "@/types/Environment"; // Đảm bảo import đúng đường dẫn type

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
    <span className="text-sm font-semibold flex items-center gap-1 text-right">
      {value} {unit && <span className="text-[10px] text-muted-foreground font-normal uppercase">{unit}</span>}
    </span>
  </div>
);

export default function Client({
  data,
}: {
  data: Co2Record;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Chi tiết bản ghi CO2
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="h-3 w-3" /> Mã thuê: <span className="font-medium text-foreground">{data.rental_id}</span>
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Tính toán lúc: <span className="font-medium text-foreground">{formatToVNTime(data.calculated_at)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid nội dung */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Block 1: Kết quả tính toán */}
        <DetailSection icon={Leaf} title="Kết quả Tính toán">
          <DetailRow label="CO2 đã tiết kiệm" value={data.co2_saved} unit={data.co2_saved_unit} />
          <DetailRow label="Quãng đường ước tính" value={data.estimated_distance_km} unit="km" />
        </DetailSection>

        {/* Block 2: Thông tin chuyến đi */}
        <DetailSection icon={Clock} title="Dữ liệu Chuyến đi">
          <DetailRow label="Mã người dùng" value={data.user_id} />
          <DetailRow label="Tổng thời gian thuê (Raw)" value={data.raw_rental_minutes} unit="phút" />
          <DetailRow label="Thời gian chạy thực tế (Effective)" value={data.effective_ride_minutes} unit="phút" />
        </DetailSection>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Block 3: Tham số môi trường được áp dụng */}
        <DetailSection icon={Activity} title="Tham số Áp dụng (Snapshot)">
          <DetailRow label="Chính sách áp dụng" value={data.policy_snapshot.policy_name} />
          <DetailRow label="Tốc độ trung bình" value={data.average_speed_kmh} unit="km/h" />
          <DetailRow label="CO2 tiết kiệm / km" value={data.co2_saved_per_km} unit={data.co2_saved_per_km_unit} />
        </DetailSection>

        {/* Block 4: Cấu hình công thức */}
        <DetailSection icon={Settings2} title="Cấu hình Công thức">
          <DetailRow label="Nguồn tính quãng đường" value={data.distance_source} />
          <DetailRow label="Phiên bản công thức" value={data.formula_version} />
          <DetailRow label="Hệ số tin cậy (Confidence Factor)" value={data.confidence_factor} />
          <DetailRow label="Scan Buffer" value={data.return_scan_buffer_minutes} unit="phút" />
        </DetailSection>
      </div>
    </div>
  );
}