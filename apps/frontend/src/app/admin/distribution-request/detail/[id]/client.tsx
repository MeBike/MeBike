"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatToVNTime } from "@/lib/formatVNDate";
import { getStatusConfig } from "@/columns/bike-colums";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// Icons
import {
  ClipboardList,
  Bike,
  Route,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  XCircle,
  Zap, // Thêm icon Zap
} from "lucide-react";

import type {
  RedistributionRequestDetail,
  RedistributionRequestStatus,
} from "@/types/DistributionRequest";
import type { BikeStatus } from "@/types";

// --- CONFIGS & HELPERS ---
export const STATUS_MAP: Record<
  string,
  { label: string; style: string; icon: any }
> = {
  PENDING_APPROVAL: {
    label: "Chờ phê duyệt",
    style: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Đã phê duyệt",
    style: "bg-blue-100 text-blue-800 border-blue-200",
    icon: ShieldCheck,
  },
  IN_TRANSIT: {
    label: "Đang vận chuyển",
    style: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Truck,
  },
  PARTIALLY_COMPLETED: {
    label: "Hoàn tất một phần",
    style: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: AlertTriangle,
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    style: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  REVERTED: {
    label: "Đã hoàn xe",
    style: "bg-orange-100 text-orange-800 border-orange-300",
    icon: ArrowUpFromLine,
  },
  REJECTED: {
    label: "Đã từ chối",
    style: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Đã hủy bỏ",
    style: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";

export const getPriorityLevelColor = (status: PriorityLevel | string) => {
  switch (status) {
    case "HIGH":
      return "bg-red-100 text-red-800 border-red-200";
    case "MEDIUM":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "LOW":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const PRIORITY_LEVEL_VI: Record<string, string> = {
  HIGH: "Cao",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
};

// --- COMPONENT ---
interface Props {
  // Mở rộng interface để chứa priorityLevel và priorityScore
  data: RedistributionRequestDetail & {
    priorityLevel?: PriorityLevel;
    priorityScore?: number;
  };
}

export const DistributionRequestDetailClient = ({ data }: Props) => {
  const router = useRouter();

  const successfulBikes = data.requestedQuantity - (data.revertedBikes || 0);

  // --- LOGIC GIAO DIỆN TIMELINE & MÀU SẮC KẾT THÚC ---
  const isCompleted = data.status === "COMPLETED";
  const isReverted = data.status === "REVERTED";
  const isRejectedOrCancelled =
    data.status === "REJECTED" || data.status === "CANCELLED";
  const isTerminal = isCompleted || isReverted || isRejectedOrCancelled;

  let TerminalIcon = CheckCircle2;
  let terminalLabel = "Hoàn tất";
  let terminalColorClass = "bg-slate-100 text-slate-400";
  let terminalLabelColor = "text-slate-400";
  let terminalTimeText = "Chưa hoàn thành";

  if (isCompleted) {
    TerminalIcon = CheckCircle2;
    terminalColorClass = "bg-emerald-500 text-white";
    terminalLabel = "Hoàn tất";
    terminalLabelColor = "text-slate-900";
    terminalTimeText = formatToVNTime(data.completedAt || data.updatedAt);
  } else if (isReverted) {
    TerminalIcon = ArrowUpFromLine;
    terminalColorClass = "bg-orange-500 text-white";
    terminalLabel = "Đã hoàn xe";
    terminalLabelColor = "text-slate-900";
    terminalTimeText = formatToVNTime(data.updatedAt);
  } else if (isRejectedOrCancelled) {
    TerminalIcon = XCircle;
    terminalColorClass = "bg-red-500 text-white";
    terminalLabel = data.status === "REJECTED" ? "Từ chối" : "Đã hủy";
    terminalLabelColor = "text-slate-900";
    terminalTimeText = formatToVNTime(data.updatedAt);
  }

  let progressWidth = "w-0";
  let progressColor = "bg-blue-500";
  if (isReverted) {
    progressWidth = "w-full";
    progressColor = "bg-orange-400";
  } else if (isRejectedOrCancelled) {
    progressWidth = "w-full";
    progressColor = "bg-red-400";
  } else if (isCompleted) {
    progressWidth = "w-full";
    progressColor = "bg-blue-500";
  } else if (data.startedAt) {
    progressWidth = "w-2/3";
    progressColor = "bg-blue-500";
  } else if (data.approvedByUser) {
    progressWidth = "w-1/3";
    progressColor = "bg-blue-500";
  }

  const getHeroColor = () => {
    switch (data.status) {
      case "COMPLETED":
        return "from-emerald-600 to-emerald-500";
      case "REVERTED":
        return "from-orange-500 to-orange-400";
      case "REJECTED":
      case "CANCELLED":
        return "from-red-600 to-red-500";
      default:
        return "from-blue-700 to-blue-600";
    }
  };

  const statusInfo = STATUS_MAP[data.status] || {
    label: "Không xác định",
    style: "bg-gray-100 border-gray-200 text-gray-800",
    icon: Clock,
  };
  const StatusIcon = statusInfo.icon;

  const UserProfileMini = ({ user, label }: { user: any; label: string }) => {
    if (!user) return null;
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100">
        <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white">
          {user?.fullName?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </span>
          <span className="font-bold text-slate-900 text-sm truncate">
            {user?.fullName || "N/A"}
          </span>
          <span className="text-xs text-slate-500 truncate">
            {user?.email || "N/A"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 bg-slate-50/30 min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between pb-2">
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="pl-0 hover:bg-transparent text-slate-500 hover:text-slate-900 transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              Yêu cầu #{data.id.substring(0, 8)}
            </h1>
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider w-fit flex items-center gap-1.5 shadow-sm ${statusInfo.style}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {statusInfo.label}
              </span>

              {data.priorityLevel && (
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider w-fit flex items-center gap-1.5 shadow-sm ${getPriorityLevelColor(data.priorityLevel)}`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Ưu tiên:{" "}
                  {PRIORITY_LEVEL_VI[data.priorityLevel] || data.priorityLevel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= TIMELINE TRẠNG THÁI ================= */}
      <Card className="shadow-sm border-slate-200 overflow-hidden bg-white rounded-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="relative flex flex-col md:flex-row justify-between w-full">
            <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-slate-100 rounded-full z-0">
              <div
                className={`h-full transition-all duration-500 rounded-full ${progressColor} ${progressWidth}`}
              ></div>
            </div>

            <div className="relative z-10 flex flex-col items-start md:items-center gap-2 mb-6 md:mb-0">
              <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md ring-4 ring-white">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="text-left md:text-center mt-2">
                <p className="font-bold text-slate-900 text-sm">Tạo yêu cầu</p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatToVNTime(data.createdAt)}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-start md:items-center gap-2 mb-6 md:mb-0">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ring-4 ring-white transition-colors ${data.approvedByUser ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-left md:text-center mt-2">
                <p
                  className={`font-bold text-sm ${data.approvedByUser ? "text-slate-900" : "text-slate-400"}`}
                >
                  Phê duyệt
                </p>
                {data.approvedByUser ? (
                  <p className="text-xs text-slate-500 mt-1">
                    {formatToVNTime(data.updatedAt)}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">Chờ xử lý</p>
                )}
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-start md:items-center gap-2 mb-6 md:mb-0">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ring-4 ring-white transition-colors ${data.startedAt ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400"}`}
              >
                <Truck className="h-5 w-5" />
              </div>
              <div className="text-left md:text-center mt-2">
                <p
                  className={`font-bold text-sm ${data.startedAt ? "text-slate-900" : "text-slate-400"}`}
                >
                  Vận chuyển
                </p>
                {data.startedAt ? (
                  <p className="text-xs text-slate-500 mt-1">
                    {formatToVNTime(data.startedAt)}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">Chưa bắt đầu</p>
                )}
              </div>
            </div>

            {/* --- Node Kết Thúc Động (Hoàn tất / Đã hoàn / Từ chối) --- */}
            <div className="relative z-10 flex flex-col items-start md:items-center gap-2">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center shadow-sm ring-4 ring-white transition-colors ${terminalColorClass}`}
              >
                <TerminalIcon className="h-5 w-5" />
              </div>
              <div className="text-left md:text-center mt-2">
                <p className={`font-bold text-sm ${terminalLabelColor}`}>
                  {terminalLabel}
                </p>
                <p
                  className={`text-xs mt-1 font-medium ${isTerminal ? terminalColorClass.split(" ")[1] : "text-slate-400"}`}
                >
                  {terminalTimeText}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================= SPLIT LAYOUT: LỘ TRÌNH & INVENTORY ================= */}
      <Card className="shadow-sm border-slate-200 overflow-hidden bg-white rounded-2xl">
        <div className="flex flex-col lg:flex-row">
          {/* CỘT TRÁI (2/3) */}
          <div className="flex-1 p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Route className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Lộ trình & Tuyến đường
              </h2>
            </div>

            <div className="relative pl-4 pt-2">
              <div className="absolute left-[2.25rem] top-10 bottom-10 w-0.5 border-l-2 border-dashed border-slate-300 z-0"></div>
              <div className="space-y-8">
                <div className="relative z-10 flex items-start gap-5">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-white border-[3px] border-slate-300 flex items-center justify-center shadow-sm">
                    <div className="h-3 w-3 rounded-full bg-slate-400"></div>
                  </div>
                  <div className="pt-1.5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                      Trạm xuất phát (Lấy xe)
                    </p>
                    <p className="font-bold text-slate-900 text-lg">
                      {data.sourceStation.name}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {data.sourceStation.address}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-start gap-5">
                  <div
                    className={`h-12 w-12 shrink-0 rounded-full bg-white border-[3px] flex items-center justify-center shadow-sm ${isReverted ? "border-orange-500" : "border-blue-500"}`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${isReverted ? "bg-orange-500" : "bg-blue-500 animate-pulse"}`}
                    ></div>
                  </div>
                  <div className="pt-1.5">
                    <p
                      className={`text-[11px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2 ${isReverted ? "text-orange-600" : "text-blue-600"}`}
                    >
                      Trạm tiếp nhận (Trả xe)
                    </p>
                    <p className="font-bold text-slate-900 text-lg">
                      {data.targetStation.name}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {data.targetStation.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Log */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Bike className="h-4 w-4 text-slate-400" />
                Biến động sức chứa tại trạm
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trạm Xuất */}
                <div className="border border-slate-100 rounded-xl p-5 shadow-sm relative overflow-hidden bg-white">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>
                  <div className="flex items-center gap-2 mb-5 ml-2">
                    <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                      <ArrowUpFromLine className="h-4 w-4" />
                    </div>
                    <span className="text-slate-700 font-bold uppercase tracking-wider text-xs">
                      Trạm Cho
                    </span>
                  </div>
                  <div className="space-y-3 ml-2">
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-500">Trước điều phối</span>
                      <span className="font-semibold text-slate-700">
                        {(data.sourceStation as any)?.availableBikesBefore ??
                          data.sourceAvailableBikesBefore ??
                          0}{" "}
                        xe
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-500">Số xe xuất đi</span>
                      <span className="font-bold text-orange-600">
                        -
                        {(data.sourceStation as any)?.bikesForRedistribution ??
                          data.requestedQuantity ??
                          0}{" "}
                        xe
                      </span>
                    </div>

                    {(data.revertedBikes > 0 || isReverted) && (
                      <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                        <span className="text-slate-500">
                          Xe hoàn trả (Nhập lại)
                        </span>
                        <span className="font-bold text-emerald-600">
                          +{isReverted && data.revertedBikes} xe
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm pt-1">
                      <span className="text-slate-600 font-medium">
                        Hiện tại / Sau điều phối
                      </span>
                      <span className="font-bold text-slate-900 text-base">
                        {data.sourceStation?.actualAvailableBikes ??
                          (data.sourceAvailableBikesBefore ?? 0) -
                            (data.requestedQuantity ?? 0) +
                            data.revertedBikes}{" "}
                        xe
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trạm Nhập */}
                <div className="border border-slate-100 rounded-xl p-5 shadow-sm relative overflow-hidden bg-white">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                  <div className="flex items-center gap-2 mb-5 ml-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <ArrowDownToLine className="h-4 w-4" />
                    </div>
                    <span className="text-slate-700 font-bold uppercase tracking-wider text-xs">
                      Trạm Nhận
                    </span>
                  </div>
                  <div className="space-y-3 ml-2">
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-500">Trước điều phối</span>
                      <span className="font-semibold text-slate-700">
                        {(data.targetStation as any)?.availableBikesBefore ??
                          data.targetAvailableBikesBefore ??
                          0}{" "}
                        xe
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-500">
                        Thực nhận / Yêu cầu
                      </span>
                      <div className="text-right">
                        <span
                          className={`font-bold ${isReverted && successfulBikes === 0 ? "text-slate-400" : "text-blue-600"}`}
                        >
                          {(data.targetStation as any)?.actualReceivedBikes ??
                            successfulBikes}
                        </span>
                        <span className="text-slate-400 font-medium">
                          {" "}
                          / {data.requestedQuantity} xe
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1">
                      <span className="text-slate-600 font-medium">
                        Hiện tại / Sau điều phối
                      </span>
                      <span className="font-bold text-slate-900 text-base">
                        {(data.targetStation as any)?.actualAvailableBikes ??
                          ((data.targetStation as any)?.availableBikesBefore ??
                            data.targetAvailableBikesBefore ??
                            0) +
                            ((data.targetStation as any)?.actualReceivedBikes ??
                              successfulBikes)}{" "}
                        xe
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (1/3) */}
          <div className="w-full lg:w-[400px] bg-slate-50 p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col gap-6">
            <div className="space-y-3">
              <div
                className={`bg-gradient-to-br ${getHeroColor()} rounded-2xl p-6 text-white shadow-lg relative overflow-hidden transition-colors`}
              >
                <div className="relative z-10">
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1 block">
                    Yêu cầu điều phối
                  </span>
                  <div className="text-5xl font-extrabold mt-1 flex items-baseline gap-2">
                    {data.requestedQuantity}{" "}
                    <span className="text-xl font-medium opacity-80">xe</span>
                  </div>
                </div>
                <Bike className="absolute -bottom-4 -right-2 w-28 h-28 text-white opacity-10 rotate-[-10deg]" />
              </div>

              {/* === BOX ĐIỂM & MỨC ĐỘ ƯU TIÊN === */}
              {data.priorityLevel && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">
                      Mức ưu tiên
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getPriorityLevelColor(data.priorityLevel)} uppercase`}
                    >
                      {PRIORITY_LEVEL_VI[data.priorityLevel]}
                    </span>
                  </div>
                </div>
              )}

              {(data.revertedBikes > 0 || isReverted) && (
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-red-600/80 text-xs font-bold uppercase tracking-wider block">
                      Xe bị hoàn trả
                    </span>
                    <span className="text-red-700 font-bold text-2xl">
                      {data.revertedBikes} <span className="text-sm">xe</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600/80 text-xs font-bold uppercase tracking-wider block">
                      Bàn giao thực tế
                    </span>
                    <span className="text-emerald-700 font-bold text-2xl">
                      {data.targetStation?.actualReceivedBikes ?? 0}{" "}
                      <span className="text-sm">xe</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 flex-1">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> Lý do điều phối
                </span>
                <p className="text-slate-800 font-medium text-sm leading-relaxed">
                  {data.reason || "Không ghi chú lý do."}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Nhân sự liên quan
              </h4>
              {data.requestedByUser && (
                <UserProfileMini
                  user={data.requestedByUser}
                  label="Người tạo yêu cầu"
                />
              )}
              {data.approvedByUser && (
                <UserProfileMini
                  user={data.approvedByUser}
                  label="Người phê duyệt"
                />
              )}

              {/* Hiển thị linh hoạt người Từ chối, Hủy hoặc Hoàn trả */}
              {(data as any).rejectedByUser && data.status === "REJECTED" && (
                <UserProfileMini
                  user={(data as any).rejectedByUser}
                  label="Người từ chối"
                />
              )}
              {data.revertedByUser &&
                (data.revertedBikes > 0 || isReverted) && (
                  <UserProfileMini
                    user={data.revertedByUser}
                    label="Người báo hoàn trả"
                  />
                )}
            </div>
          </div>
        </div>
      </Card>

      {/* ================= BẢNG DANH SÁCH XE (READ-ONLY) ================= */}
      <Card className="shadow-sm border-slate-200 overflow-hidden rounded-2xl bg-white">
        <CardHeader className="bg-white border-b border-slate-100 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bike className="h-5 w-5 text-blue-600" />
                Danh sách xe được điều phối
              </CardTitle>
              <CardDescription className="mt-1">
                Tổng cộng có {data.items?.length || 0} xe được ghi nhận trong
                lệnh này.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent border-b-slate-200">
                <TableHead className="w-[80px] text-center font-bold text-slate-600">
                  STT
                </TableHead>
                <TableHead className="font-bold text-slate-600">
                  Mã phương tiện
                </TableHead>
                <TableHead className="font-bold text-slate-600">
                  Trạng thái hiện tại
                </TableHead>
                <TableHead className="font-bold text-slate-600 text-right pr-6">
                  Thời gian bàn giao
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items && data.items.length > 0 ? (
                data.items.map((item, index) => {
                  const { label, color } = getStatusConfig(
                    item.bike.status as BikeStatus,
                  );

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="text-center font-medium text-slate-400">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-700 font-mono text-sm font-bold shadow-sm">
                          <Bike className="h-3.5 w-3.5 text-slate-400" />
                          {item.bike.bikeNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${color}`}
                        >
                          {label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-slate-700 font-medium pr-6">
                        {item.deliveredAt ? (
                          <span className="flex items-center justify-end gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            {formatToVNTime(item.deliveredAt)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-sm font-normal">
                            Chưa bàn giao
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <Bike className="h-10 w-10 text-slate-200" />
                      <p className="font-medium text-slate-500">
                        Chưa có danh sách xe cụ thể
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
