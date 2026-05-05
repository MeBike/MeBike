"use client";

import { useState } from "react";
import { Wrench, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Bike, BikeStatus } from "@/types";

interface SimpleUpdateBikeDialogProps {
  bike: Bike;
  onUpdate: (data: { status: "AVAILABLE" | "BROKEN" }) => Promise<void>;
  isUpdating: boolean;
}

// Cấu hình màu và nhãn cho trạng thái xe
export const getStatusConfig = (status: BikeStatus) => {
  switch (status) {
    case "AVAILABLE":
      return { label: "Sẵn sàng", color: "bg-green-100 text-green-800" };
    case "BOOKED":
      return { label: "Đã đặt", color: "bg-yellow-100 text-yellow-800" };
    case "RESERVED":
      return { label: "Đã giữ chỗ", color: "bg-orange-100 text-orange-800" };
    case "REDISTRIBUTING":
      return { label: "Chuẩn bị điều phối", color: "bg-purple-100 text-purple-800" };
    case "MAINTENANCE":
      return { label: "Đang bảo trì", color: "bg-blue-100 text-blue-800" };
    case "BROKEN":
      return { label: "Đang hỏng", color: "bg-red-100 text-red-800" };
    case "UNAVAILABLE":
      return { label: "Không khả dụng", color: "bg-gray-200 text-gray-800" };
    case "LOST":
      return { label: "Bị mất", color: "bg-rose-100 text-rose-800" };
    case "DISABLED":
      return { label: "Tạm ngưng hoạt động", color: "bg-slate-200 text-slate-800" };
    case "":
      return { label: "Chưa xác định", color: "bg-gray-100 text-gray-500" };
    default:
      return { label: status || "Không xác định", color: "bg-gray-100 text-gray-500" };
  }
};

export function SimpleUpdateBikeDialog({
  bike,
  onUpdate,
  isUpdating,
}: SimpleUpdateBikeDialogProps) {
  const [open, setOpen] = useState(false);
  const currentStatus = bike.status as BikeStatus;
  const targetStatus: BikeStatus = currentStatus === "AVAILABLE" ? "BROKEN" : "AVAILABLE";
  
  const handleToggleStatus = async () => {
    try {
      await onUpdate({ status: targetStatus });
      setOpen(false);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const canUpdate = currentStatus === "AVAILABLE" || currentStatus === "BROKEN";
  
  // Lấy cấu hình hiển thị từ hàm getStatusConfig
  const currentConfig = getStatusConfig(currentStatus);
  const targetConfig = getStatusConfig(targetStatus);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={currentStatus === "AVAILABLE" ? "destructive" : "outline"} 
          size="sm" 
          disabled={!canUpdate}
          className="gap-2"
        >
          {currentStatus === "AVAILABLE" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {currentStatus === "AVAILABLE" ? "Báo hỏng xe" : "Xác nhận sửa xong"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Xác nhận thay đổi trạng thái</DialogTitle>
          <DialogDescription>
            Bạn đang thực hiện thay đổi trạng thái cho xe <strong>#{bike.bikeNumber || bike.id.slice(-6)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-4 text-sm font-medium">
            {/* Sử dụng cấu hình màu và nhãn cho trạng thái hiện tại */}
            <span className={`px-3 py-1 rounded-md ${currentConfig.color}`}>
              {currentConfig.label}
            </span>
            
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            
            {/* Sử dụng cấu hình màu và nhãn cho trạng thái mục tiêu */}
            <span className={`px-3 py-1 rounded-md ${targetConfig.color}`}>
              {targetConfig.label}
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {targetStatus === "BROKEN" 
              ? "Lưu ý: Xe sẽ không thể được thuê sau khi báo hỏng." 
              : "Xác nhận xe đã được kiểm tra và sẵn sàng hoạt động trở lại."}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isUpdating}>
            Hủy
          </Button>
          <Button 
            onClick={handleToggleStatus} 
            disabled={isUpdating}
            variant={targetStatus === "AVAILABLE" ? "default" : "destructive"}
          >
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Xác nhận"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  );
}