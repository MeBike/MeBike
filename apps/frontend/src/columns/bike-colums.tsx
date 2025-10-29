import { ColumnDef } from "@tanstack/react-table";
import { Eye, RefreshCw } from "lucide-react";
import type { Bike, BikeStatus } from "@/types";
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
  //  onUpdateStatus,
 }: {
   onView?: ({ id }: { id: string }) => void;
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
    header: "Mã chip",
    cell: ({ row }) => {
      return shortenId(row.original.chip_id) || "Không có";
    },
  },
  {
    accessorKey: "station_id",
    header: "Mã trạm",
    cell: ({ row }) => row.original.station_id || "Không có",
  },
  {
    accessorKey: "supplier_id",
    header: "Mã nhà cung cấp",
    cell: ({ row }) => row.original.supplier_id || "Không có",
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
