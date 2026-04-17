"use client";

import React, { useState } from "react";
import { RedistributionRequestDetail } from "@/types/DistributionRequest";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatToVNTime } from "@/lib/formatVNDate";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bike, MapPin, ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import type { RedistributionRequestStatus } from "@/types/DistributionRequest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  data: RedistributionRequestDetail;
  onApprove: (id: string) => Promise<void>;
  // Sửa dòng này để khớp với hook
  onReject: (id: string, data: { reason: string }) => Promise<void>; 
}

export const DistributionRequestDetailClient = ({ data, onApprove, onReject }: Props) => {
  const router = useRouter();
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getStatusStyle = (status: RedistributionRequestStatus) => {
    switch (status) {
      case "PENDING_APPROVAL": return "bg-amber-100 text-amber-800 border-amber-200";
      case "APPROVED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(data.id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
  if (rejectReason.trim().length < 10) {
    toast.error("Lý do từ chối phải có ít nhất 10 ký tự");
    return;
  }
  setIsRejecting(true);
  try {
    // Truyền tham số thứ 2 là một object { reason: ... }
    await onReject(data.id, { reason: rejectReason }); 
    setIsDialogOpen(false);
    setRejectReason("");
  } finally {
    setIsRejecting(false);
  }
};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="pl-0 hover:bg-transparent text-muted-foreground hover:text-primary"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Chi tiết yêu cầu</h1>
            <Badge className={`${getStatusStyle(data.status)} px-3 py-1 text-xs font-bold uppercase shadow-sm`}>
              {data.status}
            </Badge>
          </div>
        </div>

        {/* Action Buttons: Chỉ hiện khi trạng thái là PENDING_APPROVAL */}
        {data.status === "PENDING_APPROVAL" && (
          <div className="flex items-center gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                  <XCircle className="mr-2 h-4 w-4" /> Từ chối
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Từ chối yêu cầu điều phối</DialogTitle>
                  <DialogDescription>
                    Vui lòng nhập lý do từ chối (ít nhất 10 ký tự).
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Nhập lý do tại đây..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className={rejectReason.length > 0 && rejectReason.length < 10 ? "border-red-500" : ""}
                  />
                  {rejectReason.length > 0 && rejectReason.length < 10 && (
                    <p className="text-xs text-red-500 mt-2">Cần thêm {10 - rejectReason.length} ký tự nữa.</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleReject}
                    disabled={isRejecting || rejectReason.length < 10}
                  >
                    {isRejecting ? "Đang xử lý..." : "Xác nhận từ chối"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={handleApprove}
              disabled={isApproving}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> {isApproving ? "Đang xử lý..." : "Phê duyệt"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin cơ bản */}
            <Card className="shadow-md border-none bg-slate-50/50">
              <CardHeader className="pb-3 text-primary">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" /> Thông tin cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-medium">Lý do điều phối:</span>
                  <span className="text-slate-900 italic">"{data.reason || "---"}"</span>
                </div>
                {/* Nếu đã bị reject, hiển thị lý do reject ở đây nếu API có trả về field rejectReason */}
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <span className="text-muted-foreground block font-medium">Số lượng:</span>
                    <span className="text-lg font-bold text-blue-600">{data.requestedQuantity} xe</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Ngày tạo:</span>
                    <span className="font-semibold">{formatToVNTime(data.createdAt)}</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <span className="text-muted-foreground block font-medium">Người yêu cầu:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs uppercase">
                      {data.requestedByUser.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold leading-none">{data.requestedByUser.fullName}</p>
                      <p className="text-xs text-muted-foreground">{data.requestedByUser.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lộ trình điều phối */}
            <Card className="shadow-md border-none bg-slate-50/50">
              <CardHeader className="pb-3 text-primary">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" /> Lộ trình
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-8 px-8">
                <div className="absolute left-[2.4rem] top-12 bottom-12 w-0.5 border-l-2 border-dashed border-slate-300"></div>
                <div className="relative z-10 flex flex-col">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Trạm nguồn</p>
                  <p className="font-bold text-slate-800">{data.sourceStation.name}</p>
                </div>
                <div className="relative z-10 flex flex-col">
                  <p className="text-xs font-bold text-primary uppercase">Trạm đích</p>
                  <p className="font-bold text-slate-800">{data.targetStation.name}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Items */}
          <Card className="shadow-lg border-none overflow-hidden">
             {/* ... Giữ nguyên phần Table từ code cũ của bạn ... */}
             <CardHeader className="bg-slate-900 text-white py-4">
              <CardTitle className="text-md font-medium flex items-center gap-2">
                <Bike className="h-5 w-5" /> Danh sách xe thực tế ({data.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    {/* ... Content Table giữ nguyên ... */}
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[80px] text-center font-bold">STT</TableHead>
                            <TableHead className="font-bold uppercase text-xs">Mã Chip (Bike ID)</TableHead>
                            <TableHead className="font-bold uppercase text-xs">Trạng thái xe</TableHead>
                            <TableHead className="font-bold uppercase text-xs text-right">Ngày bàn giao</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.items.map((item, index) => (
                            <TableRow key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                                <TableCell><code className="px-2 py-1 bg-slate-100 rounded text-blue-700 font-bold text-xs">{item.bike.chipId}</code></TableCell>
                                <TableCell><Badge variant="outline" className="font-semibold text-[10px] bg-white">{item.bike.status}</Badge></TableCell>
                                <TableCell className="text-right text-slate-600 font-medium">{item.deliveredAt ? formatToVNTime(item.deliveredAt) : "---"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Ghi chú */}
        <div className="space-y-6">
           <Card className="border-dashed border-2 bg-slate-50/30 shadow-none">
              <CardHeader>
                 <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground italic">Ghi chú hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-500">
                 Hành động Phê duyệt hoặc Từ chối sẽ thay đổi trạng thái ngay lập tức. Hãy kiểm tra kỹ danh sách xe trước khi thực hiện.
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};