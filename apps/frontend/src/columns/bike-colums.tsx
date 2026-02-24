import { ColumnDef } from "@tanstack/react-table";
import { Eye, RefreshCw, Pencil } from "lucide-react";
import type { Bike, BikeStatus, Station, Supplier } from "@/types";
import { formatDateUTC } from "@/utils/formatDateTime";
export const getStatusColor = (status: BikeStatus) => {
  switch (status) {
    case "ĐANG ĐƯỢC THUÊ":
      return "bg-yellow-100 text-yellow-800";
    case "ĐANG BẢO TRÌ":
      return "bg-blue-100 text-blue-800";
    case "BỊ HỎNG":
      return "bg-red-100 text-red-800";
    case "CÓ SẴN":
      return "bg-green-100 text-green-800";
    case "ĐÃ ĐẶT TRƯỚC":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};
export const bikeColumn = (
  {
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
  }
): ColumnDef<Bike>[] => [
  {
    accessorKey: "_id",
    header: "Mã xe",
    cell: ({ row }) => {
      return shortenId(row.original._id) || "Không có";
    },
  },
  {
    accessorKey: "chip_id",
    header: "Tên chip",
    cell: ({ row }) => {
      return row.original.chip_id || "Không có";
    },
  },
  {
    accessorKey: "station_id",
    header: "Tên trạm",
    cell: ({ row }) => {
      const station = stations.find((s) => s.id === row.original.station_id);
      return station ? station.name : "Không có";
    },
  },
  {
    accessorKey: "supplier_id",
    header: "Tên nhà cung cấp",
    cell: ({ row }) => {
      const supplier = suppliers.find(
        (s) => s._id === row.original.supplier_id
      );
      return supplier ? supplier.name : "Không có";
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
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return formatDateUTC(row.original.created_at);
    },
  },
  {
    accessorKey: "updated_at",
    header: "Ngày cập nhật",
    cell: ({ row }) => {
      return formatDateUTC(row.original.updated_at);
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
        <button
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Chỉnh sửa"
          onClick={() => {
            if (onEdit) {
              onEdit({ id: row.original._id });
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
