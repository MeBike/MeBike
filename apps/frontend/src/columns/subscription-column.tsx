import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit2, Trash2 } from "lucide-react";
import type { Subscription, SubscriptionStatus } from "@custom-types";
import { formatToVNTime } from "@/lib/formatVNDate";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export const getVerifyStatusColor = (status: SubscriptionStatus) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "EXPIRED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

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
export const subscriptionColumns = ({
  onView,
}: {
  onView?: ({ id }: { id: string }) => void;
}): ColumnDef<Subscription>[] => [
  {
    accessorKey: "packageName",
    header: "Tên gói",
    cell: ({ row }) => row.original.packageName,
  },
  {
    accessorKey: "maxUsages",
    header: "Tối đa",
    cell: ({ row }) => row.original.maxUsages || "Không có",
  },
  {
    accessorKey: "usageCount",
    header: "Đã dùng",
    cell: ({ row }) => row.original.usageCount,
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
    accessorKey: "price",
    header: "Giá",
    cell: ({ row }) => row.original.price,
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="flex items-center gap-0">
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Xem chi tiết"
                  onClick={() => {
                    onView?.({ id: row.original.id });
                  }}
                >
                  <Eye className="text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xem chi tiết</TooltipContent>
            </Tooltip>
          </div>
        </div>
    ),
  },
];
