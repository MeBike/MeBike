import { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Nhớ import đúng file chứa type của bạn
import type { Co2RecordItem } from "@/types/Environment"; 

export const co2RecordColumn = ({
  onView,
}: {
  onView?: (record: Co2RecordItem) => void;
}): ColumnDef<Co2RecordItem>[] => [
  {
    accessorKey: "rental_id",
    header: "Mã thuê xe",
    cell: ({ row }) => (
      <div className="font-medium truncate max-w-[120px]" title={row.original.rental_id}>
        {row.original.rental_id}
      </div>
    ),
  },
  {
    accessorKey: "user_id",
    header: "Mã người dùng",
    cell: ({ row }) => (
      <div className="truncate max-w-[120px] text-muted-foreground" title={row.original.user_id}>
        {row.original.user_id}
      </div>
    ),
  },
  {
    accessorKey: "estimated_distance_km",
    header: "Quãng đường (km)",
    cell: ({ row }) => <div>{row.original.estimated_distance_km}</div>,
  },
  {
    accessorKey: "co2_saved",
    header: "CO2 tiết kiệm",
    cell: ({ row }) => (
      <div className="text-emerald-600 font-semibold">
        {row.original.co2_saved}{" "}
        <span className="text-xs font-normal text-muted-foreground uppercase">
          {row.original.co2_saved_unit}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "effective_ride_minutes",
    header: "T.gian di chuyển",
    cell: ({ row }) => <div>{row.original.effective_ride_minutes} phút</div>,
  },
  {
    accessorKey: "distance_source",
    header: "Nguồn tính",
    cell: ({ row }) => (
      <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-secondary text-secondary-foreground">
        {row.original.distance_source}
      </span>
    ),
  },
  {
    accessorKey: "calculated_at",
    header: "Ngày tính",
    cell: ({ row }) => <div>{formatToVNTime(row.original.calculated_at)}</div>,
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="flex items-center gap-0">
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
      </div>
    ),
  },
];