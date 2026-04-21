import { ColumnDef } from "@tanstack/react-table";
import { Eye, Clock, CheckCircle2, XCircle, Truck } from "lucide-react";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { 
  RedistributionRequest, 
  RedistributionRequestStatus 
} from "@/types/DistributionRequest";

// --- 1. CONFIG TỪ ĐIỂN TIẾNG VIỆT ---

// Tiếng Việt cho trạng thái điều phối
const REQUEST_STATUS_VI: Record<string, string> = {
  PENDING_APPROVAL: "Chờ phê duyệt",
  APPROVED: "Đã phê duyệt",
  IN_TRANSIT: "Đang vận chuyển",
  PARTIALLY_COMPLETED: "Hoàn thành 1 phần",
  COMPLETED: "Đã hoàn thành",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã hủy",
};

// Tiếng Việt cho trạng thái xe (Dựa trên các trạng thái phổ biến của bạn)
const BIKE_STATUS_VI: Record<string, string> = {
  AVAILABLE: "Sẵn sàng",
  BROKEN: "Hỏng hóc",
  MAINTENANCE: "Bảo trì",
  UNAVAILABLE: "Không khả dụng",
  RENTED: "Đang được thuê",
  BOOKED: "Đã đặt chỗ",
  RESERVED: "Đã giữ chỗ",
};

// --- 2. HÀM HELPER XỬ LÝ MÀU SẮC ---
export const getRequestStatusColor = (status: RedistributionRequestStatus) => {
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

// --- 3. COLUMN ĐIỀU PHỐI ---
export const redistributionColumn = ({
  onView,
}: {
  onView?: ({ id }: { id: string }) => void;
}): ColumnDef<RedistributionRequest>[] => [
  {
    accessorKey: "id",
    header: "Mã yêu cầu",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium">
        {row.original.id.slice(0, 8).toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: "sourceStation",
    header: "Trạm nguồn",
    cell: ({ row }) => row.original.sourceStation.name,
  },
  {
    accessorKey: "targetStation",
    header: "Trạm đích",
    cell: ({ row }) => row.original.targetStation.name,
  },
  {
    accessorKey: "requestedQuantity",
    header: "Số lượng",
    cell: ({ row }) => (
      row.original.requestedQuantity
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRequestStatusColor(status)} uppercase`}
        >
          {/* Map sang tiếng Việt, nếu chưa có trong từ điển thì giữ nguyên fallback */}
          {REQUEST_STATUS_VI[status] || status.replace("_", " ")}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView?.({ id: row.original.id })}
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Xem chi tiết điều phối</TooltipContent>
        </Tooltip>
      </div>
    ),
  },
];

// --- 4. COLUMN CHI TIẾT XE ---
export const redistributionItemColumn = (): ColumnDef<any>[] => [
  {
    accessorKey: "bike.status",
    header: "Tình trạng xe",
    cell: ({ row }) => {
       const status = row.original.bike.status;
       return (
         <span className="font-medium">
           {BIKE_STATUS_VI[status] || status.toLowerCase()}
         </span>
       )
    },
  },
  {
    accessorKey: "deliveredAt",
    header: "Thời gian đến trạm",
    cell: ({ row }) => {
      return row.original.deliveredAt 
        ? formatToVNTime(row.original.deliveredAt) 
        : <span className="text-muted-foreground italic">Chưa giao</span>;
    },
  }
];