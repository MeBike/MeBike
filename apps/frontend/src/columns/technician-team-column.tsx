import { ColumnDef } from "@tanstack/react-table";
import { Eye, Recycle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Giả sử bạn import type từ file riêng, mình để ở đây để tham chiếu
export type TechnicianStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface TechnicianTeamRecord {
  id: string;
  name: string;
  station: {
    id: string;
    name: string;
  };
  availabilityStatus: TechnicianStatus;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// 1. Cập nhật STATUS_CONFIG theo TechnicianStatus
const STATUS_CONFIG: Record<TechnicianStatus, { label: string; color: string }> = {
  AVAILABLE: { 
    label: "Sẵn sàng", 
    color: "bg-emerald-100 text-emerald-700 border-emerald-200" 
  },
  UNAVAILABLE: { 
    label: "Không sẵn sàng", 
    color: "bg-rose-100 text-rose-700 border-rose-200" 
  },
};

export const columns = ({
  onView,
  onChangeStatus,
}: {
  onView?: (team: TechnicianTeamRecord) => void;
  // Đổi type của newStatus cho khớp với TechnicianStatus
  onChangeStatus?: (id: string, newStatus: TechnicianStatus) => void; 
}): ColumnDef<TechnicianTeamRecord>[] => [
  {
    accessorKey: "name",
    header: "Tên đội kỹ thuật",
  },
  {
    // Cột trạm trực thuộc (lấy từ object station)
    id: "station",
    header: "Trạm trực thuộc",
    cell: ({ row }) => row.original.station?.name || "N/A",
  },
  {
    accessorKey: "memberCount",
    header: "Số thành viên",
    cell: ({ row }) => row.original.memberCount,
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      const dateStr = row.original.createdAt;
      if (!dateStr) return "N/A";
      // Format ngày tháng cho dễ nhìn, ví dụ: 26/04/2026
      return new Date(dateStr).toLocaleDateString("vi-VN");
    },
  },
  {
    accessorKey: "availabilityStatus",
    header: "Trạng thái",
    cell: ({ row }) => {
      const statusValue = row.original.availabilityStatus;
      // Lấy config theo status, ép kiểu an toàn
      const config = STATUS_CONFIG[statusValue] || { 
        label: statusValue || "Không rõ", 
        color: "bg-muted text-muted-foreground border-border" 
      };

      return (
        <span
          className={`px-2.5 py-1 whitespace-nowrap border rounded-full text-xs font-semibold ${config.color}`}
        >
          {config.label}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center gap-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Xem chi tiết"
                onClick={() => onView?.(row.original)}
              >
                <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xem chi tiết</TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
];