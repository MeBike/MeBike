import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Eye, RefreshCw } from "lucide-react";
import type { Reservation } from "@/types/Reservation";
import type { Station } from "@/types/Station";
import { formatDateUTC } from "@/utils/formatDateTime";

export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};

export const reservationColumn = ({
  onView,
  onUpdateStatus,
  onEdit,
  stations,
}: {
  onView?: ({ id }: { id: string }) => void;
  onUpdateStatus?: ((data: Reservation) => void) | undefined;
  onEdit?: ({ data }: { data: Reservation }) => void;
  stations?: Station[];
}): ColumnDef<Reservation>[] => [
  {
    accessorKey: "_id",
    header: "Mã đặt trước",
    cell: ({ row }) => {
      return shortenId(row.original._id);
    },
  },
  {
    accessorKey: "user_id",
    header: "Mã người dùng",
    cell: ({ row }) => row.original.user_id,
  },
  {
    accessorKey: "bike_id",
    header: "Mã xe",
    cell: ({ row }) => row.original.bike_id,
  },
  {
    accessorKey: "station_id",
    header: "Tên trạm",
    cell: ({ row }) => {
      const station = stations?.find((s) => s._id === row.original.station_id);
      return station ? station.name : row.original.station_id;
    },
  },
  {
    accessorKey: "prepaid",
    header: "Đặt cọc",
    cell: ({ row }) =>
      `${Number(row.original.prepaid).toLocaleString("vi-VN")} VND`,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.original.status === "ĐANG HOẠT ĐỘNG"
            ? "bg-green-100 text-green-800"
            : row.original.status === "ĐANG CHỜ XỬ LÝ"
              ? "bg-yellow-100 text-yellow-800"
              : row.original.status === "ĐÃ HẾT HẠN"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
        }`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "start_time",
    header: "Thời gian bắt đầu",
    cell: ({ row }) =>
      formatDateUTC(row.original.start_time),
  },
  {
    accessorKey: "end_time",
    header: "Thời gian kết thúc",
    cell: ({ row }) => {
      if(row.original.end_time){
        return formatDateUTC(row.original.end_time);
      }
      else {
        return "Chưa kết thúc";
      }
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
              onView({ id: row.original._id });
            }
          }}
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </button>
        {row.original.status !== "ĐÃ HẾT HẠN" &&
        row.original.status !== "ĐÃ HỦY" &&
        onEdit ? (
          <div>
            <button
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Chỉnh sửa"
              onClick={() => {
                if (onEdit) {
                  onEdit({ data: row.original });
                }
              }}
            >
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              title="Cập nhật trạng thái"
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              onClick={() => onUpdateStatus?.(row.original)}
            >
              <RefreshCw className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        ) : null}
      </div>
    ),
  },
];
