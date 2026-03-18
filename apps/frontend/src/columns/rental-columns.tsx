import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Eye, RefreshCw } from "lucide-react";
import type { Rental } from "@/types/Rental";
import { formatToVNTime } from "@/lib/formatVNDate";
import { shortenId } from "@utils";
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
            : row.original.status === "RESERVED"
            ? "bg-yellow-100 text-yellow-800"
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
      <div className="flex items-center gap-2">
        <button
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Xem chi tiết"
          onClick={() => {
            if (onView) {
              onView({ id: row.original.id });
            }
          }}
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </button>
        {row.original.status !== "COMPLETED" &&
        row.original.status !== "CANCELLED" &&
        onEdit ? (
          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Xem chi tiết"
            onClick={() => {
              if (onEdit) {
                onEdit({ data: row.original });
              }
            }}
          >
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : null}
        <button
          title="Cập nhật trạng thái"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          onClick={() => onUpdateStatus?.(row.original)}
        >
          <RefreshCw className="w-4 h-4 text-blue-500" />
        </button>
      </div>
    ),
  },
];
