import { ColumnDef } from "@tanstack/react-table";
import { Eye, Clock, CheckCircle2, XCircle, Truck } from "lucide-react";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Environment , EnvironmentStatus } from "@/types/Environment";
export const getRequestStatusColor = (status: EnvironmentStatus) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 border-green-200";
    case "INACTIVE":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Màu vàng thường dùng cho trạng thái "nghỉ/không hoạt động"
    case "SUSPENDED":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "BANNED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};
export const redistributionColumn = ({
  onView,
}: {
  onView?: ({ id }: { id: string }) => void;
}): ColumnDef<Environment>[] => [
  {
    accessorKey: "name",
    header: "Tên chính sách",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "average_speed_kmh",
    header: "Tốc độ TB (km/h)",
    cell: ({ row }) => <div>{row.original.average_speed_kmh}</div>,
  },
  {
    accessorKey: "co2_saved_per_km",
    header: "CO2 tiết kiệm/km",
    cell: ({ row }) => (
      <div>
        {row.original.co2_saved_per_km} {row.original.co2_saved_per_km_unit}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRequestStatusColor(status)}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => formatToVNTime(row.original.created_at),
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView?.({ id: row.original.id })}
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Xem chi tiết chính sách</TooltipContent>
        </Tooltip>
      </div>
    ),
  },
];