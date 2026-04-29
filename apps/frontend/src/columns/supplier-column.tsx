import { ColumnDef } from "@tanstack/react-table";
import { Eye, Recycle } from "lucide-react";
import type { Supplier } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { 
    label: "Đang hoạt động", 
    color: "bg-emerald-100 text-emerald-700 border-emerald-200" 
  },
  INACTIVE: { 
    label: "Không hoạt động", 
    color: "bg-rose-100 text-rose-700 border-rose-200" 
  },
  TERMINATED: { 
    label: "Đã kết thúc", 
    color: "bg-slate-100 text-slate-700 border-slate-200" 
  },
};

export const columns = ({
  onView,
  onChangeStatus,
}: {
  onView?: (supplier: Supplier) => void;
  onChangeStatus?: (id: string, newStatus: "ACTIVE" | "INACTIVE" | "TERMINATED") => void;
}): ColumnDef<Supplier>[] => [
  {
    accessorKey: "name",
    header: "Tên nhà cung cấp",
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
  },
  {
    accessorKey: "phoneNumber",
    header: "Số điện thoại",
    cell: ({ row }) => row.original.phoneNumber,
  },
  {
    accessorKey: "contractFee",
    header: "Phí hợp đồng",
    cell: ({ row }) => `${row.original.contractFee}%`, // Thêm % nếu đây là tỷ lệ phí
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const statusValue = row.original.status || "";
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