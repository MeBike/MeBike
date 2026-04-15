"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Phone, Mail, User, Building2, Warehouse,
  ArrowLeft, CheckCircle2, XCircle, Calendar, Info,
  Bike, Navigation, Loader2, LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatToVNTime } from "@/lib/formatVNDate";
import ActionRequestModal from "../../components/ActionModal";
const DetailSection = ({ icon: Icon, title, children }: { icon: LucideIcon, title: string, children?: React.ReactNode }) => (
  <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
    <div className="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-5 py-4">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
    </div>
    <div className="flex-1 p-5 space-y-4">{children}</div>
  </div>
);
const DetailRow = ({ label, value, icon: Icon }: { label: string, value?: React.ReactNode, icon?: LucideIcon }) => (
  <div className="flex flex-col gap-1 border-b border-border/40 pb-3 last:border-0 last:pb-0">
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {Icon && <Icon className="h-3 w-3" />} {label}
    </span>
    <span className="text-sm font-medium">{value || "Chưa cập nhật"}</span>
  </div>
);
interface AgencyRequestDetailClientProps {
  id: string;
  data: any;
  isLoading: boolean;
  onApprove: (payload: { id: string; description?: string }) => Promise<any>;
  onReject: (payload: { id: string; reason?: string; description?: string }) => Promise<any>;
}
export default function AgencyRequestDetailClient({
  id,
  data,
  isLoading,
  onApprove,
  onReject,
}: AgencyRequestDetailClientProps) {
  const router = useRouter();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "APPROVE" | "REJECT" | null;
  }>({ isOpen: false, type: null });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmAction = async (payload: {
    description?: string;
    reason?: string;
  }) => {
    setIsProcessing(true);
    try {
      if (modalState.type === "APPROVE") {
        await onApprove({
          id,
          description: payload.description,
        });
      } else if (modalState.type === "REJECT") {
        await onReject({
          id,
          reason: payload.reason,
          description: payload.description,
        });
      }
      setModalState({ isOpen: false, type: null });
      router.refresh();
    } catch (error) {
      console.error("Action Failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  if (!data) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-muted-foreground">Không tìm thấy yêu cầu này.</p>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 rounded-xl border border-primary/10 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">Chi tiết yêu cầu Agency</h1>
              <Badge className={cn(
                  "font-medium",
                  data.status === "PENDING"
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                    : data.status === "APPROVED"
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-red-100 text-red-700 hover:bg-red-100",
                )}
              >
                {data.status}
              </Badge>
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> Gửi ngày: {data.createdAt ? formatToVNTime(data.createdAt) : "N/A"}
            </p>
          </div>
        </div>

        {/* NÚT THAO TÁC NẾU ĐANG PENDING */}
        {data.status === "PENDING" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={() => setModalState({ isOpen: true, type: "REJECT" })}
            >
              <XCircle className="mr-2 h-4 w-4" /> Từ chối
            </Button>
            <Button
              className="bg-green-600 font-medium text-white shadow-md shadow-green-200 hover:bg-green-700"
              onClick={() => setModalState({ isOpen: true, type: "APPROVE" })}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Phê duyệt
            </Button>
          </div>
        )}
      </div>

      {/* CHI TIẾT NGƯỜI DÙNG & TRẠM */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DetailSection icon={User} title="Người yêu cầu">
          <DetailRow label="Họ tên" value={data.requesterUser?.fullName} icon={User} />
          <DetailRow label="Email liên hệ" value={data.requesterEmail} icon={Mail} />
          <DetailRow label="Số điện thoại" value={data.requesterPhone} icon={Phone} />
        </DetailSection>

        <DetailSection icon={Building2} title="Thông tin Agency">
          <DetailRow label="Tên thương hiệu" value={data.agencyName} icon={Building2} />
          <DetailRow label="Địa chỉ văn phòng" value={data.agencyAddress} icon={MapPin} />
          <DetailRow label="SĐT kinh doanh" value={data.agencyContactPhone} icon={Phone} />
        </DetailSection>

        <DetailSection icon={Warehouse} title="Thông tin Trạm xe">
          <DetailRow label="Tên trạm" value={data.stationName} icon={Warehouse} />
          <DetailRow label="Địa chỉ đặt trạm" value={data.stationAddress} icon={MapPin} />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Sức chứa</p>
              <p className="flex items-center gap-1 text-lg font-bold text-primary">
                <Bike className="h-4 w-4" /> {data.stationTotalCapacity}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Lượt Pick/Return</p>
              <p className="text-sm font-bold">{data.stationPickupSlotLimit} / {data.stationReturnSlotLimit}</p>
            </div>
          </div>
        </DetailSection>
      </div>

      {/* THÔNG TIN BỔ SUNG & TỌA ĐỘ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection icon={Navigation} title="Vị trí tọa độ">
          <div className="flex justify-around rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Vĩ độ (Latitude)</p>
              <code className="font-mono text-sm font-bold text-blue-600">{data.stationLatitude}</code>
            </div>
            <div className="border-r border-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Kinh độ (Longitude)</p>
              <code className="font-mono text-sm font-bold text-blue-600">{data.stationLongitude}</code>
            </div>
          </div>
        </DetailSection>

        <DetailSection icon={Info} title="Thông tin bổ sung">
          <div className="space-y-4">
            <div>
              <div className="mb-1 text-xs uppercase text-muted-foreground">Mô tả từ người gửi:</div>
              <div className="min-h-[60px] rounded-lg bg-muted/30 p-3 text-sm">
                {data.description || "Không có mô tả kèm theo."}
              </div>
            </div>
            {data.status !== "PENDING" && (
              <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
                <p className="text-xs font-bold uppercase text-primary">Người xử lý:</p>
                <p className="text-sm font-medium">{data.reviewedByUser?.fullName || "Hệ thống"}</p>
              </div>
            )}
          </div>
        </DetailSection>
      </div>

      {/* MODAL XÁC NHẬN */}
      <ActionRequestModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        isLoading={isProcessing}
        onClose={() => setModalState({ isOpen: false, type: null })}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}