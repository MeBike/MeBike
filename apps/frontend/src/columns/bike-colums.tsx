import { ColumnDef } from "@tanstack/react-table";
import { Eye, RefreshCw, Pencil } from "lucide-react";
import type { Bike, BikeStatus, Station, Supplier } from "@/types";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export const getStatusConfig = (status: BikeStatus) => {
  switch (status) {
    case "AVAILABLE":
      return { label: "Sẵn sàng", color: "bg-green-100 text-green-800" };
    case "BOOKED":
      return { label: "Đã đặt", color: "bg-yellow-100 text-yellow-800" };
    case "RESERVED":
      return { label: "Đã giữ chỗ", color: "bg-orange-100 text-orange-800" };
    case "REDISTRIBUTING":
      return { label: "Đang điều phối", color: "bg-purple-100 text-purple-800" };
    case "MAINTENANCE":
      return { label: "Đang bảo trì", color: "bg-blue-100 text-blue-800" };
    case "BROKEN":
      return { label: "Đang hỏng", color: "bg-red-100 text-red-800" };
    case "UNAVAILABLE":
      return { label: "Không khả dụng", color: "bg-gray-200 text-gray-800" };
    case "LOST":
      return { label: "Bị mất", color: "bg-rose-100 text-rose-800" }; // Dùng màu rose/đỏ đậm cho xe mất
    case "DISABLED":
      return { label: "Vô hiệu hóa", color: "bg-slate-200 text-slate-800" }; // Dùng màu slate cho xe bị vô hiệu hóa
    case "":
      return { label: "Chưa xác định", color: "bg-gray-100 text-gray-500" };
    default:
      return { label: status || "Không xác định", color: "bg-gray-100 text-gray-500" };
  }
};
export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};
export const bikeColumn = ({
  onView,
}: {
  onView?: ({ id }: { id: string }) => void;
}): ColumnDef<Bike>[] => [
  {
    accessorKey: "station",
    header: "Tên trạm",
    cell: ({ row }) => {
      return row.original.station.name || "Không có";
    },
  },
  {
    accessorKey: "supplierId",
    header: "Tên nhà cung cấp",
    cell: ({ row }) => {
      return row.original.supplier.name || "Không có";
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const { label, color } = getStatusConfig(
        row.original.status as BikeStatus,
      );
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return row.original.createdAt
        ? formatToVNTime(row.original.createdAt)
        : "Không có";
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Ngày cập nhật",
    cell: ({ row }) => {
      return row.original.updatedAt
        ? formatToVNTime(row.original.updatedAt)
        : "Không có";
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
export const bikeColumnForStaff = ({
  onView,
  onEdit,
  stations = [],
  suppliers = [],
  //  onUpdateStatus,
}: {
  onView?: ({ id }: { id: string }) => void;
  onEdit?: ({ id }: { id: string }) => void;
  stations?: Station[];
  suppliers?: Supplier[];
  //  onUpdateStatus?: ((data: ) => void) | undefined;
}): ColumnDef<Bike>[] => [
  {
    accessorKey: "stationId",
    header: "Tên trạm",
    cell: ({ row }) => {
      return row.original.station.name || "Không có";
    },
  },
  {
    accessorKey: "supplierId",
    header: "Tên nhà cung cấp",
    cell: ({ row }) => {
      return row.original.supplier.name || "Không có";
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const { label, color } = getStatusConfig(
        row.original.status as BikeStatus,
      );
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return row.original.createdAt
        ? formatToVNTime(row.original.createdAt)
        : "Không có";
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Ngày cập nhật",
    cell: ({ row }) => {
      return row.original.updatedAt
        ? formatToVNTime(row.original.updatedAt)
        : "Không có";
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
