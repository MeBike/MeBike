import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Eye, RefreshCw } from "lucide-react";
import type { Rental } from "@/types/Rental";
import { formatToVNTime } from "@/lib/formatVNDate";
import { shortenId } from "@utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export const rentalColumn = ({
  onView,
  onUpdateStatus,
  onEdit,
}: {
  onView?: ({ id }: { id: string }) => void;
  onUpdateStatus?: ((data: Rental) => void) | undefined;
  onEdit?: ({ data }: { data: Rental }) => void;
}): ColumnDef<Rental>[] => [
  {
    accessorKey: "fullname",
    header: "Tên người dùng",
    cell: ({ row }) => row.original.user.fullname,
  },
  {
    accessorKey: "bike_id",
    header: "Mã xe",
    cell: ({ row }) => shortenId(row.original.bikeId) || "Không có",
  },
  {
    accessorKey: "total_price",
    header: "Tổng tiền",
    cell: ({ row }) =>
      `${Number(row.original.totalPrice).toLocaleString("vi-VN")} VND`,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.original.status === "RENTED"
            ? "bg-blue-100 text-blue-800"
            : row.original.status === "COMPLETED"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
        }`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return formatToVNTime(row.original.createdAt);
    },
  },
  {
    accessorKey: "updated_at",
    header: "Ngày cập nhật",
    cell: ({ row }) => {
      return formatToVNTime(row.original.updatedAt);
    },
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="flex items-center gap-0">
        <div className="pl-4.5">
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

export const rentalColumnForStaff = ({
  onView,
}: {
  onView?: ({ id }: { id: string }) => void;
  onUpdateStatus?: ((data: Rental) => void) | undefined;
  onEdit?: ({ data }: { data: Rental }) => void;
}): ColumnDef<Rental>[] => [
  {
    accessorKey: "fullname",
    header: "Tên người dùng",
    cell: ({ row }) => row.original.user.fullname,
  },
  {
    accessorKey: "bike_id",
    header: "Mã xe",
    cell: ({ row }) => shortenId(row.original.bikeId) || "Không có",
  },
  {
    accessorKey: "total_price",
    header: "Tổng tiền",
    cell: ({ row }) =>
      `${Number(row.original.totalPrice).toLocaleString("vi-VN")} VND`,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.original.status === "RENTED"
            ? "bg-blue-100 text-blue-800"
            : row.original.status === "COMPLETED"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
        }`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return formatToVNTime(row.original.createdAt);
    },
  },
  {
    accessorKey: "updated_at",
    header: "Ngày cập nhật",
    cell: ({ row }) => {
      return formatToVNTime(row.original.updatedAt);
    },
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="flex items-center gap-0">
        <div className="pl-4.5">
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
