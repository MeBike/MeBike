import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "APPROVE" | "REJECT" | null;
  onConfirm: (payload: { description?: string; reason?: string }) => void;
  isLoading: boolean;
}

export default function ActionRequestModal({ isOpen, onClose, type, onConfirm, isLoading }: ActionModalProps) {
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    onConfirm({ description, reason });
    // Reset form sau khi gửi
    setDescription("");
    setReason("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "APPROVE" ? "Chấp nhận yêu cầu Agency" : "Từ chối yêu cầu Agency"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Reject thì hiện thêm lý do (Reason) */}
          {type === "REJECT" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do từ chối (Ngắn gọn)</Label>
              <Input 
                id="reason" 
                placeholder="Ví dụ: Hồ sơ thiếu thông tin..." 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="desc">Mô tả chi tiết (Description)</Label>
            <Textarea 
              id="desc" 
              placeholder="Nhập nội dung phản hồi cho người dùng..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Hủy</Button>
          <Button 
            variant={type === "REJECT" ? "destructive" : "default"} 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
