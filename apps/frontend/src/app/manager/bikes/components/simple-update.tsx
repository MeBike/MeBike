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

export function SimpleUpdateBikeDialog({
  bike,
  onUpdate,
  isUpdating,
}: SimpleUpdateBikeDialogProps) {
  const [open, setOpen] = useState(false);
  const currentStatus = bike.status as BikeStatus;

  // Xác định trạng thái mục tiêu
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
            <span className="px-3 py-1 bg-muted rounded-md">{currentStatus}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className={`px-3 py-1 rounded-md ${targetStatus === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {targetStatus}
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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  );
}