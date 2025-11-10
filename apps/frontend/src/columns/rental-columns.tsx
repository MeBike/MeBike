import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Eye, RefreshCw } from "lucide-react";
import type { RentingHistory } from "@/types/Rental";
export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};
export const rentalColumn = ({
  onView,
  onUpdateStatus,
  onEdit,
}: {
  onView?: ({ id }: { id: string }) => void;
  onUpdateStatus?: ((data: RentingHistory) => void) | undefined;
  onEdit?: ({ data }: { data: RentingHistory }) => void;
}): ColumnDef<RentingHistory>[] => [
  {
    accessorKey: "_id",
    header: "Mã đơn thuê",
    cell: ({ row }) => {
      return shortenId(row.original._id);
    },
  },
  {
    accessorKey: "user_id",
    header: "Tên người dùng",
    cell: ({ row }) => row.original.user.fullname,
  },
  {
    accessorKey: "bike_id",
    header: "Mã xe",
    cell: ({ row }) => row.original.bike_id,
  },
  {
    accessorKey: "total_price",
    header: "Tổng tiền",
    cell: ({ row }) =>
      `${Number(row.original.total_price).toLocaleString("vi-VN")} VND`,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.original.status === "ĐANG THUÊ"
            ? "bg-blue-100 text-blue-800"
            : row.original.status === "HOÀN THÀNH"
              ? "bg-green-100 text-green-800"
              : row.original.status === "ĐÃ ĐẶT TRƯỚC"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
        }`}
      >
        {row.original.status}
      </span>
    ),
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
              onView({ id: row.original._id });
            }
          }}
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </button>
        {row.original.status !== "HOÀN THÀNH" && row.original.status !== "ĐÃ HỦY"  && onEdit ? (
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
