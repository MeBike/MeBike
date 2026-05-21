"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
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
  onUpdate: (data: { status: "AVAILABLE" }) => Promise<void>;
  isUpdating: boolean;
}

// Bổ sung type "FIXED" nếu trong BikeStatus của bạn chưa có
export const getStatusConfig = (status: BikeStatus | "FIXED") => {
  switch (status) {
    case "AVAILABLE":
      return { label: "Sẵn sàng", color: "bg-green-100 text-green-800" };
    case "FIXED":
      return { label: "Đã sửa xong", color: "bg-emerald-100 text-emerald-800" };
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
  const currentStatus = bike.status as BikeStatus | "FIXED";
  const targetStatus = "AVAILABLE"; // Luôn luôn là AVAILABLE đối với Staff
  
  const handleConfirmReady = async () => {
    try {
      await onUpdate({ status: targetStatus });
      setOpen(false);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  // Nút chỉ bấm được khi xe đang ở trạng thái FIXED
  const canUpdate = currentStatus === "FIXED";
  
  const currentConfig = getStatusConfig(currentStatus);
  const targetConfig = getStatusConfig(targetStatus);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default"
          size="sm" 
          disabled={!canUpdate}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Đưa vào hoạt động
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Xác nhận đưa xe vào hoạt động</DialogTitle>
          <DialogDescription>
            Bạn đang xác nhận xe <strong>#{bike.bikeNumber || bike.id.slice(-6)}</strong> đã sẵn sàng để khách thuê.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className={`px-3 py-1 rounded-md ${currentConfig.color}`}>
              {currentConfig.label}
            </span>
            
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            
            <span className={`px-3 py-1 rounded-md ${targetConfig.color}`}>
              {targetConfig.label}
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Xác nhận xe đã được kiểm tra kỹ thuật và đủ điều kiện để hoạt động trở lại.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isUpdating}>
            Hủy
          </Button>
          <Button 
            onClick={handleConfirmReady} 
            disabled={isUpdating}
            variant="default"
          >
            {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Xác nhận sẵn sàng"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}