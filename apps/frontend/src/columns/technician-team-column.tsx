import { ColumnDef } from "@tanstack/react-table";
import { Eye, Recycle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { TechnicianTeamRecord,TechnicianStatus } from "@/types";
import { formatToVNTime } from "@/lib/formatVNDate";
const STATUS_CONFIG: Record<TechnicianStatus, { label: string; color: string }> = {
  AVAILABLE: { 
    label: "Sẵn sàng", 
    color: "bg-emerald-100 text-emerald-700 border-emerald-200" 
  },
  UNAVAILABLE: { 
    label: "Không sẵn sàng", 
    color: "bg-rose-100 text-rose-700 border-rose-200" 
  },
  "": { 
    label: "Không sẵn sàng", 
    color: "bg-rose-100 text-rose-700 border-rose-200" 
  },
};

export const columns = ({
  onView,
}: {
  onView?: (team: TechnicianTeamRecord) => void;
}): ColumnDef<TechnicianTeamRecord>[] => [
  {
    id: "station",
    header: "Trạm trực thuộc",
    cell: ({ row }) => row.original.station?.name || "N/A",
  },
  {
    accessorKey: "memberCount",
    header: "Số thành viên",
    cell: ({ row }) => row.original.memberCount,
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return formatToVNTime(row.original.createdAt);
    },
  },
  {
    accessorKey: "availabilityStatus",
    header: "Trạng thái",
    cell: ({ row }) => {
      const statusValue = row.original.availabilityStatus;
      const config = STATUS_CONFIG[statusValue] || { 
        label: statusValue || "Không rõ", 
        color: "bg-muted text-muted-foreground border-border" 
      };

      return (
        <span
          className={`px-2.5 py-1 whitespace-nowrap border rounded-full text-xs font-semibold ${config.color}`}
        >
          {config.label}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Hành động</div>,
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full transition-colors hover:text-primary"
                aria-label="Xem chi tiết"
                onClick={() => onView?.(row.original)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xem chi tiết</TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
];