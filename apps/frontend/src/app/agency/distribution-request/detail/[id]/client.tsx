"use client";

import React, { useState } from "react";
import { RedistributionRequestDetail } from "@/types/DistributionRequest";
import { Badge } from "@/components/ui/badge";
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
import { formatToVNTime } from "@/lib/formatVNDate";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  MapPin,
  ClipboardList,
  CheckCircle,
  XCircle,
  Loader2,
  CheckCheck,
  Truck // Thêm icon Truck cho Start Transit
} from "lucide-react";
import type { RedistributionRequestStatus } from "@/types/DistributionRequest";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger, // Bổ sung import bị thiếu
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrentStation } from "@/types";

interface Props {
  data: RedistributionRequestDetail;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onStartTransit: () => Promise<void>;
  onCancel: (reason: string) => Promise<void>;
  onComplete: (payload: { completedBikeIds: string[] }) => Promise<void>;
  listStation?: CurrentStation;
}

export const DistributionRequestDetailClient = ({
  data,
  onApprove,
  onReject,
  onComplete,
  listStation,
  onStartTransit,
  onCancel,
}: Props) => {
  const router = useRouter();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBikeIds, setSelectedBikeIds] = useState<string[]>([]);
  const canApproveReject = listStation?.currentStation.id == data.targetStation.id;
  const canStartTransit = listStation?.currentStation.id == data.sourceStation.id && data.status === "APPROVED";
  const canComplete = listStation?.currentStation.id == data.targetStation.id && data.status === "IN_TRANSIT";
  const canCancel = listStation?.currentStation.id === data.sourceStation.id;

  const STATUS_MAP: Record<
    RedistributionRequestStatus,
    { label: string; style: string }
  > = {
    PENDING_APPROVAL: {
      label: "Chờ phê duyệt",
      style: "bg-amber-100 text-amber-800 border-amber-200",
    },
    APPROVED: {
      label: "Đã phê duyệt",
      style: "bg-blue-100 text-blue-800 border-blue-200",
    },
    IN_TRANSIT: {
      label: "Đang vận chuyển",
      style: "bg-purple-100 text-purple-800 border-purple-200",
    },
    PARTIALLY_COMPLETED: {
      label: "Hoàn tất một phần",
      style: "bg-indigo-100 text-indigo-800 border-indigo-200",
    },
    COMPLETED: {
      label: "Đã hoàn thành",
      style: "bg-green-100 text-green-800 border-green-200",
    },
    REJECTED: {
      label: "Đã từ chối",
      style: "bg-red-100 text-red-800 border-red-200",
    },
    CANCELLED: {
      label: "Đã hủy bỏ",
      style: "bg-slate-100 text-slate-800 border-slate-200",
    },
  };

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
      setSelectedBikeIds([]);
      setShowRejectModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidRejectReason = rejectReason.trim().length >= 10;
  const isValidCancelReason = cancelReason.trim().length >= 10;

  const handleRejectSubmit = async () => {
    if (!isValidRejectReason) return;
    setIsProcessing(true);
    try {
      await onReject(rejectReason);
      setShowRejectModal(false);
    } finally {
      setIsProcessing(false);
      setRejectReason("");
    }
  };

  const handleCancelSubmit = async () => {
    if (!isValidCancelReason) return;
    setIsProcessing(true);
    try {
      await onCancel(cancelReason);
      setIsCancelDialogOpen(false);
    } finally {
      setIsProcessing(false);
      setCancelReason("");
    }
  };

  const handleToggleBike = (bikeId: string) => {
    setSelectedBikeIds((prev) =>
      prev.includes(bikeId)
        ? prev.filter((id) => id !== bikeId)
        : [...prev, bikeId],
    );
  };

  const statusInfo = STATUS_MAP[data.status] || {
    label: "Không xác định",
    style: "bg-gray-100",
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
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
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Chi tiết yêu cầu điều phối
            </h1>
            <Badge
              className={`px-2.5 py-0.5 rounded-full border text-xs font-medium ${statusInfo.style}`}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex gap-3 flex-wrap">
          
          {/* FLOW 1: PENDING APPROVAL -> Approve / Reject / Cancel */}
          {data.status === "PENDING_APPROVAL" && (
            <>
              {canCancel && (
                <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="bg-slate-500 hover:bg-slate-600 shadow-sm" disabled={isProcessing}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Hủy yêu cầu
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Hủy yêu cầu điều phối</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                      <Textarea 
                        placeholder="Nhập lý do hủy yêu cầu (tối thiểu 10 ký tự)..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="resize-none"
                        rows={4}
                      />
                      <p className={`text-xs text-right font-medium ${isValidCancelReason ? "text-green-600" : "text-red-500"}`}>
                        {cancelReason.trim().length} / 10 ký tự
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isProcessing}>
                        Đóng
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancelSubmit} 
                        disabled={isProcessing || !isValidCancelReason}
                      >
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xác nhận hủy
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {canApproveReject && (
                <>
                  <Button variant="destructive" onClick={() => setShowRejectModal(true)} disabled={isProcessing}>
                    <XCircle className="mr-2 h-4 w-4" /> Từ chối
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction(onApprove)} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Duyệt yêu cầu
                  </Button>
                </>
              )}
            </>
          )}

          {/* FLOW 2: APPROVED -> Start Transit */}
          {data.status === "APPROVED" && canStartTransit && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAction(onStartTransit)} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Truck className="mr-2 h-4 w-4" />}
              Bắt đầu vận chuyển
            </Button>
          )}

          {/* FLOW 3: IN TRANSIT / PARTIALLY COMPLETED -> Complete */}
          {(data.status === "IN_TRANSIT" || data.status === "PARTIALLY_COMPLETED") && canComplete && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleAction(() => onComplete({ completedBikeIds: selectedBikeIds }))}
              disabled={isProcessing || selectedBikeIds.length === 0}
            >
              {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCheck className="mr-2 h-4 w-4" />}
              Hoàn tất ({selectedBikeIds.length} xe)
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md border-none bg-slate-50/50">
              <CardHeader className="pb-3 text-primary">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" /> Thông tin
                  cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-medium">Lý do điều phối:</span>
                  <span className="text-slate-900 italic">{data.reason || "Không có lý do cụ thể"}</span>
                </div>
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
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
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

            <Card className="shadow-md border-none bg-slate-50/50">
              <CardHeader className="pb-3 text-primary">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" /> Lộ trình điều phối
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-8 px-8">
                <div className="absolute left-[2.4rem] top-12 bottom-12 w-0.5 bg-dashed border-l-2 border-dashed border-slate-300"></div>
                <div className="relative z-10 flex flex-col">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-white border-2 border-slate-400 flex items-center justify-center shadow-sm">
                      <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Trạm nguồn</p>
                      <p className="font-bold text-slate-800 uppercase tracking-wide">{data.sourceStation.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{data.sourceStation.address}</p>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 flex flex-col">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-sm">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">Trạm đích</p>
                      <p className="font-bold text-slate-800 uppercase tracking-wide">{data.targetStation.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{data.targetStation.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white py-4">
              <CardTitle className="text-md font-medium flex items-center gap-2">
                <Bike className="h-5 w-5" /> Danh sách xe thực tế ({data.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center font-bold">Chọn</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Mã Chip (Bike ID)</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Trạng thái xe</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Ngày bàn giao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <TableCell className="text-center">
                        {!item.deliveredAt && (
                          <Checkbox
                            checked={selectedBikeIds.includes(item.bike.id)}
                            onCheckedChange={() => handleToggleBike(item.bike.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-slate-100 rounded text-blue-700 font-bold text-xs">
                          {item.bike.id}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-semibold text-[10px] bg-white">
                          {item.bike.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-slate-600 font-medium">
                        {item.deliveredAt ? formatToVNTime(item.deliveredAt) : "Chưa có"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-dashed border-2 bg-slate-50/30">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground italic">
                Ghi chú hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Yêu cầu này được xử lý tự động bởi hệ thống quản lý MeBike.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lý do từ chối yêu cầu</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối (tối thiểu 10 ký tự)..."
              className="resize-none"
              rows={4}
            />
            <p className={`text-xs text-right font-medium ${isValidRejectReason ? "text-green-600" : "text-red-500"}`}>
              {rejectReason.trim().length} / 10 ký tự
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={isProcessing}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={isProcessing || !isValidRejectReason}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};