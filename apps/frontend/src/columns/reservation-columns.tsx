import { ColumnDef } from "@tanstack/react-table";
import { Edit2, Eye, RefreshCw } from "lucide-react";
import type { Reservation } from "@/types/Reservation";
import { Button } from "@/components/ui/button";
import type { Station } from "@/types/Station";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatToVNTime } from "@/lib/formatVNDate";
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
    accessorKey: "stationId",
    header: "Tên trạm",
    cell: ({ row }) => {
      const station = stations?.find((s) => s.id === row.original.stationId);
      return station ? station.name : row.original.stationId;
    },
  },
  {
    accessorKey: "reservationOption",
    header: "Loại đặt trước",
    cell: ({ row }) => {
      return row.original.reservationOption;
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
          row.original.status === "ACTIVE"
            ? "bg-green-100 text-green-800"
            : row.original.status === "PENDING"
              ? "bg-yellow-100 text-yellow-800"
              : row.original.status === "EXPIRED"
                ? "bg-orange-100 text-orange-800"
                : row.original.status === "CANCELLED"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-100 text-gray-800"
        }`}
      >
        {row.original.status}
      </span>
    ),
  },
  // {
  //   accessorKey: "start_time",
  //   header: "Thời gian bắt đầu",
  //   cell: ({ row }) => formatToVNTime(row.original.startTime),
  // },
  // {
  //   accessorKey: "end_time",
  //   header: "Thời gian kết thúc",
  //   cell: ({ row }) => {
  //     if (row.original.endTime) {
  //       return formatToVNTime(row.original.endTime);
  //     } else {
  //       return "Chưa kết thúc";
  //     }
  //   },
  // },
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
        {row.original.status !== "CANCELLED" &&
        row.original.status !== "EXPIRED" &&
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
export const reservationColumnForStaff = ({
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
    accessorKey: "stationId",
    header: "Tên trạm",
    cell: ({ row }) => {
      const station = stations?.find((s) => s.id === row.original.stationId);
      return station ? station.name : row.original.stationId;
    },
  },
  {
    accessorKey: "reservationOption",
    header: "Loại đặt trước",
    cell: ({ row }) => {
      return row.original.reservationOption;
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
          row.original.status === "ACTIVE"
            ? "bg-green-100 text-green-800"
            : row.original.status === "PENDING"
              ? "bg-yellow-100 text-yellow-800"
              : row.original.status === "EXPIRED"
                ? "bg-orange-100 text-orange-800"
                : row.original.status === "CANCELLED"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-100 text-gray-800"
        }`}
      >
        {row.original.status}
      </span>
    ),
  },
  // {
  //   accessorKey: "start_time",
  //   header: "Thời gian bắt đầu",
  //   cell: ({ row }) => formatToVNTime(row.original.startTime),
  // },
  // {
  //   accessorKey: "end_time",
  //   header: "Thời gian kết thúc",
  //   cell: ({ row }) => {
  //     if (row.original.endTime) {
  //       return formatToVNTime(row.original.endTime);
  //     } else {
  //       return "Chưa kết thúc";
  //     }
  //   },
  // },
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
