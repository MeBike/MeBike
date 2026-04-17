"use client";

import React from "react";
import { RedistributionRequestDetail } from "@/types/DistributionRequest";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Giả sử dùng Shadcn Button
import { formatToVNTime } from "@/lib/formatVNDate";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bike, MapPin, ClipboardList } from "lucide-react"; // Import icon cho đẹp
import type { RedistributionRequestStatus } from "@/types/DistributionRequest";
interface Props {
  data: RedistributionRequestDetail;
}

export const DistributionRequestDetailClient = ({ data }: Props) => {
  const router = useRouter();

  // Hàm xử lý màu sắc Badge dựa trên status
  const getStatusStyle = (status: RedistributionRequestStatus) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "IN_TRANSIT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "PARTIALLY_COMPLETED":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header với nút Back */}
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
            <Badge className={`${getStatusStyle(data.status)} px-3 py-1 text-xs font-bold uppercase shadow-sm`}>
              {data.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Thông tin cơ bản & Lộ trình */}
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
                  <span className="text-slate-900 italic">"{data.reason || "Không có lý do cụ thể"}"</span>
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

            {/* Lộ trình điều phối */}
            <Card className="shadow-md border-none bg-slate-50/50">
              <CardHeader className="pb-3 text-primary">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" /> Lộ trình điều phối
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-8 px-8">
                {/* Đường nối giữa 2 trạm */}
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

          {/* Danh sách xe điều phối */}
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
                      <TableCell>
                        <code className="px-2 py-1 bg-slate-100 rounded text-blue-700 font-bold text-xs">
                          {item.bike.chipId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-semibold text-[10px] bg-white">
                          {item.bike.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-slate-600 font-medium">
                        {item.deliveredAt ? formatToVNTime(item.deliveredAt) : "---"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Chưa có danh sách xe cụ thể cho yêu cầu này.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Timeline hoặc Hành động phụ (nếu cần mở rộng sau này) */}
        <div className="space-y-6">
           <Card className="border-dashed border-2 bg-slate-50/30">
              <CardHeader>
                 <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground italic">Ghi chú hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-500">
                 Yêu cầu này được xử lý tự động bởi hệ thống quản lý MeBike. Mọi thay đổi về trạng thái sẽ được thông báo qua email cho các bên liên quan.
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};