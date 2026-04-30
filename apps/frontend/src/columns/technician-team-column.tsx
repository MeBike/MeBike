import { ColumnDef } from "@tanstack/react-table";
import { Eye, Recycle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { TechnicianTeamRecord,TechnicianStatus } from "@/types";
const STATUS_CONFIG: Record<TechnicianStatus, { label: string; color: string }> = {
  AVAILABLE: { 
    label: "Sẵn sàng", 
    color: "bg-emerald-100 text-emerald-700 border-emerald-200" 
  },
  UNAVAILABLE: { 
    label: "Không sẵn sàng", 
    color: "bg-rose-100 text-rose-700 border-rose-200" 
  },
  "": { 
    label: "Không sẵn sàng", 
    color: "bg-rose-100 text-rose-700 border-rose-200" 
  },
};

export const columns = ({
  onView,
}: {
  onView?: (team: TechnicianTeamRecord) => void;
}): ColumnDef<TechnicianTeamRecord>[] => [
  {
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
    // Chỉnh Header thành một hàm để có thể thêm class căn giữa
    header: () => <div className="text-center">Hành động</div>,
    cell: ({ row }) => {
      return (
        /* Sử dụng justify-center để căn giữa icon trong ô */
        <div className="flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                // Thêm hover:bg-accent để nút trông tự nhiên hơn khi di chuột vào
                className="h-8 w-8 rounded-full transition-colors hover:text-primary"
                aria-label="Xem chi tiết"
                onClick={() => onView?.(row.original)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xem chi tiết</TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
];