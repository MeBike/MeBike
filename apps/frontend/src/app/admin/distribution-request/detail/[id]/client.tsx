"use client";

import React from "react";
import { RedistributionRequestDetail } from "@/types/DistributionRequest";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatToVNTime } from "@/lib/formatVNDate";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Bike, MapPin, ClipboardList, 
  UserCheck, History, Clock, XCircle, Ban 
} from "lucide-react";
import type { RedistributionRequestStatus } from "@/types/DistributionRequest";

// Config mapping tiếng Việt
const REQUEST_STATUS_VI: Record<string, string> = {
  PENDING_APPROVAL: "Chờ phê duyệt",
  APPROVED: "Đã phê duyệt",
  IN_TRANSIT: "Đang vận chuyển",
  PARTIALLY_COMPLETED: "Hoàn thành 1 phần",
  COMPLETED: "Đã hoàn thành",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã hủy",
};

interface Props {
  data: RedistributionRequestDetail;
}

export const DistributionRequestDetailClient = ({ data }: Props) => {
  const router = useRouter();

  // Xác định Label cho người xử lý dựa trên status
  const isRejected = data.status === "REJECTED";
  const isCancelled = data.status === "CANCELLED";
  
  let actionUserLabel = "Người phê duyệt";
  let ActionIcon = UserCheck;

  if (isRejected) {
    actionUserLabel = "Người từ chối";
    ActionIcon = XCircle;
  } else if (isCancelled) {
    actionUserLabel = "Người hủy đơn";
    ActionIcon = Ban;
  }

  const getStatusStyle = (status: RedistributionRequestStatus) => {
    switch (status) {
      case "PENDING_APPROVAL": return "bg-amber-100 text-amber-800 border-amber-200";
      case "APPROVED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "IN_TRANSIT": return "bg-purple-100 text-purple-800 border-purple-200";
      case "PARTIALLY_COMPLETED": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="pl-0 hover:bg-transparent text-muted-foreground hover:text-primary transition-all"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Chi tiết yêu cầu điều phối
            </h1>
            <Badge className={`${getStatusStyle(data.status)} px-3 py-1 text-xs font-bold uppercase shadow-sm`}>
              {REQUEST_STATUS_VI[data.status] || data.status}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Mã yêu cầu: {data.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: Stakeholders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-500" /> Người yêu cầu
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                    {data.requestedByUser.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{data.requestedByUser.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{data.requestedByUser.email}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">ID Người dùng:</p>
                  <code className="text-[10px] bg-slate-50 border p-1 rounded block mt-1 truncate text-slate-600 font-mono">
                    {data.requestedByUser.id}
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card className={`shadow-sm border-slate-200 ${!data.approvedByUser ? "bg-slate-50/40 border-dashed" : ""}`}>
              <CardHeader className="pb-3 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ActionIcon className={`h-4 w-4 ${(isRejected || isCancelled) ? "text-red-500" : "text-green-500"}`} /> 
                  {actionUserLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {data.approvedByUser ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold shrink-0 ${(isRejected || isCancelled) ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {data.approvedByUser.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{data.approvedByUser.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{data.approvedByUser.email}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">ID Người xử lý:</p>
                      <code className="text-[10px] bg-white border p-1 rounded block mt-1 truncate text-slate-600 font-mono">
                        {data.approvedByUser.id}
                      </code>
                    </div>
                  </>
                ) : (
                  <div className="py-4 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
                    <UserCheck className="h-8 w-8 opacity-20" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-500">Chưa có thông tin</p>
                      <p className="text-[10px]">Yêu cầu đang chờ quản lý phê duyệt</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lộ trình & Xe */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
             <CardHeader className="pb-3 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" /> Lộ trình vận chuyển
                </CardTitle>
              </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                <div className="flex-1 w-full p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Trạm đi</p>
                  <p className="font-extrabold text-slate-800">{data.sourceStation.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">ID: {data.sourceStation.id}</p>
                </div>

                <div className="flex flex-col items-center">
                  <Badge variant="secondary" className="font-bold shrink-0">{data.requestedQuantity} xe đạp</Badge>
                </div>

                <div className="flex-1 w-full p-4 rounded-xl bg-blue-50 border border-blue-100 text-right">
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Trạm đến</p>
                  <p className="font-extrabold text-slate-800">{data.targetStation.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">ID: {data.targetStation.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white py-4">
              <CardTitle className="text-md font-medium flex items-center gap-2">
                <Bike className="h-5 w-5 text-blue-400" /> Danh sách xe thực tế ({data.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[80px] text-center font-bold text-xs uppercase">STT</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Thông tin xe</TableHead>
                    <TableHead className="font-bold uppercase text-xs">Trạng thái xe</TableHead>
                    <TableHead className="font-bold uppercase text-xs text-right">Ngày bàn giao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-blue-50/30">
                      <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                           <span className="font-bold text-slate-900 text-sm">#{item.bike.bikeNumber}</span>
                           <code className="text-[9px] text-blue-600 bg-blue-50 w-fit px-1 rounded font-mono">{item.bike.id}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{item.bike.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-slate-600 text-xs">
                        {item.deliveredAt ? formatToVNTime(item.deliveredAt) : "---"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic text-sm">
                        Chưa có xe nào được gán cho yêu cầu này.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Timeline & Ghi chú */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <History className="h-4 w-4" /> Nhật ký thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative space-y-6 pl-6 border-l-2 border-slate-100 ml-2">
                <div>
                  <div className="absolute -left-[calc(0.5rem+1px)] h-4 w-4 rounded-full border-4 border-white bg-slate-400 shadow-sm"></div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Tạo yêu cầu</p>
                  <p className="text-sm font-semibold">{formatToVNTime(data.createdAt)}</p>
                </div>

                {(isRejected || isCancelled) ? (
                  <div>
                    <div className="absolute -left-[calc(0.5rem+1px)] h-4 w-4 rounded-full border-4 border-white bg-red-500 shadow-sm"></div>
                    <p className="text-[10px] font-bold text-red-600 uppercase">
                      {REQUEST_STATUS_VI[data.status]}
                    </p>
                    <p className="text-sm font-semibold">{formatToVNTime(data.updatedAt)}</p>
                  </div>
                ) : (
                  <>
                    {data.startedAt && (
                      <div>
                        <div className="absolute -left-[calc(0.5rem+1px)] h-4 w-4 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase">{REQUEST_STATUS_VI.IN_TRANSIT}</p>
                        <p className="text-sm font-semibold">{formatToVNTime(data.startedAt)}</p>
                      </div>
                    )}
                    {data.completedAt && (
                      <div>
                        <div className="absolute -left-[calc(0.5rem+1px)] h-4 w-4 rounded-full border-4 border-white bg-green-500 shadow-sm"></div>
                        <p className="text-[10px] font-bold text-green-600 uppercase">{REQUEST_STATUS_VI.COMPLETED}</p>
                        <p className="text-sm font-semibold">{formatToVNTime(data.completedAt)}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-sm border-dashed border-2 ${(isRejected || isCancelled) ? "bg-red-50/50 border-red-200" : "bg-amber-50/50 border-amber-200"}`}>
            <CardHeader className="pb-2">
               <CardTitle className={`text-xs font-bold uppercase flex items-center gap-2 ${(isRejected || isCancelled) ? "text-red-700" : "text-amber-700"}`}>
                  <Clock className="h-3 w-3" /> Ghi chú / Lý do
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className={`text-sm italic ${(isRejected || isCancelled) ? "text-red-900" : "text-amber-900"}`}>
                  {data.reason || "Không có nội dung ghi chú."}
               </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};