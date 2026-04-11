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
export const getStatusColor = (status: BikeStatus) => {
  switch (status) {
    case "BOOKED":
      return "bg-yellow-100 text-yellow-800";
    case "MAINTENANCE":
      return "bg-blue-100 text-blue-800";
    case "BROKEN":
      return "bg-red-100 text-red-800";
    case "AVAILABLE":
      return "bg-green-100 text-green-800";
    case "RESERVED":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};
export const bikeColumn = ({
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
    accessorKey: "chipId",
    header: "Tên chip",
    cell: ({ row }) => {
      return shortenId(row.original.chipId) || "Không có";
    },
  },
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
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.original.status as BikeStatus)}`}
      >
        {row.original.status}
      </span>
    ),
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
        <button
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Chỉnh sửa"
          onClick={() => {
            if (onEdit) {
              onEdit({ id: row.original.id });
            }
          }}
        >
          <Pencil className="w-4 h-4 text-blue-500" />
        </button>
        <button
          title="Cập nhật trạng thái"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          onClick={() => {}}
        >
          <RefreshCw className="w-4 h-4 text-blue-500" />
        </button>
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
    accessorKey: "chipId",
    header: "Tên chip",
    cell: ({ row }) => {
      return shortenId(row.original.chipId) || "Không có";
    },
  },
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
      <span>{row.original.supplier.name}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.original.status as BikeStatus)}`}
      >
        {row.original.status}
      </span>
    ),
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
