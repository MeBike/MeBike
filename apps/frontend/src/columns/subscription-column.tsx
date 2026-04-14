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
import Link from "next/link";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

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
    cell: ({ row }) => row.original.maxUsages,
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
      return (
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getVerifyStatusColor(
            row.original.status,
          )}`}
        >
          {row.original.status}
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
