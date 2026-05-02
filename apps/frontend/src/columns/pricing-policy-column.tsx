import { ColumnDef } from "@tanstack/react-table";
import { Eye, RefreshCw, Pencil } from "lucide-react";
import type { PricingPolicy,PricingPolicyStatus } from "@/types";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const getPricingPolicyStatusConfig = (status: PricingPolicyStatus) => {
  switch (status) {
    case "ACTIVE":
      return { label: "Đang hoạt động", color: "bg-green-100 text-green-800" };
    case "INACTIVE":
      return { label: "Ngừng hoạt động", color: "bg-gray-100 text-gray-800" };
    case "SUSPENDED":
      return { label: "Tạm dừng", color: "bg-yellow-100 text-yellow-800" };
    case "BANNED":
      return { label: "Bị cấm", color: "bg-red-100 text-red-800" };
    default:
      return { label: status, color: "bg-slate-100 text-slate-800" };
  }
};
export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};
export const pricingPolicyColumns = ({
  onView,
  onEdit,
}: {
  onView?: ({ id }: { id: string }) => void;
  onEdit?: ({ id }: { id: string }) => void;
}): ColumnDef<PricingPolicy>[] => [
  {
    accessorKey: "name",
    header: "Tên chính sách",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "base_rate",
    header: "Giá cơ bản",
    cell: ({ row }) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(row.original.base_rate);
    },
  },
  {
    accessorKey: "billing_unit_minutes",
    header: "Đơn vị (phút)",
    cell: ({ row }) => `${row.original.billing_unit_minutes} phút`,
  },
  {
    accessorKey: "deposit_required",
    header: "Tiền đặt cọc",
    cell: ({ row }) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(row.original.deposit_required);
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const { label, color } = getPricingPolicyStatusConfig(row.original.status);
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => formatToVNTime(row.original.created_at),
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
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
          <TooltipContent>Xem chi tiết</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.({ id: row.original.id })}
            >
              <Pencil className="w-4 h-4 text-blue-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Chỉnh sửa</TooltipContent>
        </Tooltip>
      </div>
    ),
  },
];
