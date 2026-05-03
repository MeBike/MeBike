"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatToVNTime } from "@/lib/formatVNDate";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Icons
import {
  ArrowLeft,
  Bike,
  MapPin,
  ClipboardList,
  CheckCircle,
  XCircle,
  Loader2,
  CheckCheck,
} from "lucide-react";

// Types
import type { RedistributionRequestDetail, RedistributionRequestStatus } from "@/types/DistributionRequest";
import type { CurrentStation, BikeStatus } from "@/types";

// --- CONFIGS & HELPERS ---
export const STATUS_MAP: Record<RedistributionRequestStatus, { label: string; style: string }> = {
  PENDING_APPROVAL: { label: "Chờ phê duyệt", style: "bg-amber-100 text-amber-800 border-amber-200" },
  APPROVED: { label: "Đã phê duyệt", style: "bg-blue-100 text-blue-800 border-blue-200" },
  IN_TRANSIT: { label: "Đang vận chuyển", style: "bg-purple-100 text-purple-800 border-purple-200" },
  PARTIALLY_COMPLETED: { label: "Hoàn tất một phần", style: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  COMPLETED: { label: "Đã hoàn thành", style: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "Đã từ chối", style: "bg-red-100 text-red-800 border-red-200" },
  CANCELLED: { label: "Đã hủy bỏ", style: "bg-red-100 text-red-800 border-red-200" },
};

export const getStatusConfig = (status: BikeStatus) => {
  switch (status) {
    case "AVAILABLE": return { label: "Sẵn sàng", color: "bg-green-100 text-green-800 border-green-200" };
    case "BOOKED": return { label: "Đã đặt", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    case "RESERVED": return { label: "Đã giữ chỗ", color: "bg-orange-100 text-orange-800 border-orange-200" };
    case "REDISTRIBUTING": return { label: "Đang điều phối", color: "bg-purple-100 text-purple-800 border-purple-200" };
    case "MAINTENANCE": return { label: "Đang bảo trì", color: "bg-blue-100 text-blue-800 border-blue-200" };
    case "BROKEN": return { label: "Đang hỏng", color: "bg-red-100 text-red-800 border-red-200" };
    case "UNAVAILABLE": return { label: "Không khả dụng", color: "bg-gray-200 text-gray-800 border-gray-300" };
    case "LOST": return { label: "Bị mất", color: "bg-rose-100 text-rose-800 border-rose-200" };
    case "DISABLED": return { label: "Vô hiệu hóa", color: "bg-slate-200 text-slate-800 border-slate-300" };
    case "": return { label: "Chưa xác định", color: "bg-gray-100 text-gray-500 border-gray-200" };
    default: return { label: status || "Không xác định", color: "bg-gray-100 text-gray-500 border-gray-200" };
  }
};

// --- COMPONENT ---
interface Props {
  data: RedistributionRequestDetail;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onComplete: (payload: { completedBikeIds: string[] }) => Promise<void>;
  listStation?: CurrentStation;
}

export const DistributionRequestDetailClient = ({
  data,
  onApprove,
  onReject,
  onComplete,
  listStation,
}: Props) => {
  const router = useRouter();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBikeIds, setSelectedBikeIds] = useState<string[]>([]);

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    await action();
    setSelectedBikeIds([]);
    setIsProcessing(false);
    setShowRejectModal(false);
  };

  const isValid = rejectReason.trim().length >= 10;

  const handleRejectSubmit = async () => {
    if (!isValid) return;
    setIsProcessing(true);
    try {
      await onReject(rejectReason);
      setShowRejectModal(false);
    } finally {
      setIsProcessing(false);
      setRejectReason("");
    }
  };

  const handleToggleBike = (bikeId: string) => {
    setSelectedBikeIds((prev) =>
      prev.includes(bikeId) ? prev.filter((id) => id !== bikeId) : [...prev, bikeId]
    );
  };

  const statusInfo = STATUS_MAP[data.status] || { label: "Không xác định", style: "bg-gray-100 text-gray-800 border-gray-200" };

  const currentStationId = listStation?.currentStation.id;
  const canAction = currentStationId === data.targetStation.id;
  const showCheckboxColumn = data.status === "IN_TRANSIT" || data.status === "PARTIALLY_COMPLETED";

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between border-b pb-6">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="pl-0 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              Chi tiết yêu cầu điều phối
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase w-fit ${statusInfo.style}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        {canAction && (
          <div className="flex gap-3 flex-wrap pt-2 md:pt-0">
            {data.status === "PENDING_APPROVAL" && (
              <>
                <Button variant="destructive" onClick={() => setShowRejectModal(true)} disabled={isProcessing} className="shadow-sm">
                  <XCircle className="mr-2 h-4 w-4" /> Từ chối
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm" onClick={() => handleAction(onApprove)} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Duyệt yêu cầu
                </Button>
              </>
            )}

            {(data.status === "IN_TRANSIT" || data.status === "PARTIALLY_COMPLETED") && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                onClick={() => handleAction(() => onComplete({ completedBikeIds: selectedBikeIds }))}
                disabled={isProcessing || selectedBikeIds.length === 0}
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                Hoàn tất ({selectedBikeIds.length} xe)
              </Button>
            )}
          </div>
        )}
      </div>

      {/* CONTENT SECTION */}
      <div className="space-y-8">
        
        {/* Row 1: Basic Info & Route Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Info Card */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/80 pb-4 border-b">
              <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                <ClipboardList className="h-5 w-5 text-blue-500" /> Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5 text-sm">
              <div className="flex flex-col gap-1.5">
                <span className="text-slate-500 font-medium">Lý do điều phối</span>
                <span className="text-slate-900 font-medium">{data.reason || "Không có lý do cụ thể"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block text-xs font-medium uppercase tracking-wider mb-1">Số lượng</span>
                  <span className="text-xl font-bold text-blue-700">{data.requestedQuantity} xe</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block text-xs font-medium uppercase tracking-wider mb-1">Ngày tạo</span>
                  <span className="font-semibold text-slate-700">{formatToVNTime(data.createdAt)}</span>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 block font-medium mb-2">Người yêu cầu</span>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {data.requestedByUser.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">{data.requestedByUser.fullName}</span>
                    <span className="text-xs text-slate-500">{data.requestedByUser.email}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Card */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/80 pb-4 border-b">
              <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                <MapPin className="h-5 w-5 text-red-500" /> Lộ trình điều phối
              </CardTitle>
            </CardHeader>
            <CardContent className="relative pt-8 px-6 md:px-10 pb-8">
              {/* Dashed Line */}
              <div className="absolute left-[2.95rem] md:left-[3.95rem] top-14 bottom-14 w-0.5 border-l-2 border-dashed border-slate-300"></div>
              <div className="space-y-8">
                <div className="relative z-10 flex items-start gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-400"></div>
                  </div>
                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Trạm xuất phát</p>
                    <p className="font-bold text-slate-900 text-base">{data.sourceStation.name}</p>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{data.sourceStation.address}</p>
                  </div>
                </div>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center shadow-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                  </div>
                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Trạm đích đến</p>
                    <p className="font-bold text-slate-900 text-base">{data.targetStation.name}</p>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{data.targetStation.address}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Table List (Full Width) */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-slate-900 text-white py-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bike className="h-5 w-5 text-blue-400" /> Danh sách xe thực tế ({data.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  {showCheckboxColumn && (
                    <TableHead className="w-[60px] text-center font-bold text-slate-600">Chọn</TableHead>
                  )}
                  <TableHead className="w-[60px] text-center font-bold text-slate-600">STT</TableHead>
                  <TableHead className="font-bold text-slate-600">Mã xe (Bike ID)</TableHead>
                  <TableHead className="font-bold text-slate-600">Trạng thái</TableHead>
                  <TableHead className="font-bold text-slate-600 text-right pr-6">Thời gian bàn giao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length > 0 ? (
                  data.items.map((item, index) => {
                    const { label, color } = getStatusConfig(item.bike.status as BikeStatus);
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                        {showCheckboxColumn && (
                          <TableCell className="text-center">
                            {!item.deliveredAt && (
                              <Checkbox
                                checked={selectedBikeIds.includes(item.bike.id)}
                                onCheckedChange={() => handleToggleBike(item.bike.id)}
                              />
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                        <TableCell>
                          <code className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200 text-slate-700 font-mono text-xs font-semibold">
                            {item.bike.id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
                            {label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-slate-600 font-medium pr-6">
                          {item.deliveredAt ? formatToVNTime(item.deliveredAt) : (
                            <span className="text-slate-400 italic font-normal">Chưa bàn giao</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={showCheckboxColumn ? 5 : 4} className="h-32 text-center text-slate-500">
                      Chưa có danh sách xe cụ thể cho yêu cầu này.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lý do từ chối yêu cầu</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)..."
              className="resize-none focus-visible:ring-red-500"
              rows={4}
            />
            <p className={`text-xs text-right font-medium ${isValid ? "text-emerald-600" : "text-rose-500"}`}>
              {rejectReason.trim().length} / 10 ký tự
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={isProcessing || !isValid}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};