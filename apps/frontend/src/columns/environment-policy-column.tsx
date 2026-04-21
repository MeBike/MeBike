import { ColumnDef } from "@tanstack/react-table";
import { Eye, Power, PowerOff } from "lucide-react";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Environment, EnvironmentStatus } from "@/types/Environment";
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
  onActive,
}: {
  onView?: ({ id }: { id: string }) => void;
  onActive: (environment: Environment) => void;
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
  // {
  //   accessorKey: "created_at",
  //   header: "Ngày tạo",
  //   cell: ({ row }) => formatToVNTime(row.original.created_at),
  // },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="flex items-center gap-0">
        <div className="">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Xem chi tiết"
                onClick={() => onView?.(row.original)}
              >
                <Eye className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xem chi tiết</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              {row.original.status === "ACTIVE" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onActive(row.original)}
                  className="text-destructive"
                >
                  <PowerOff className="w-4 h-4" />{" "}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onActive(row.original)}
                  className="text-emerald-600"
                >
                  <Power className="w-4 h-4" />{" "}
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent>
              {row.original.status === "ACTIVE" ? "Hủy kích hoạt" : "Kích hoạt"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    ),
  },
];
