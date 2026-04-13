import { ColumnDef } from "@tanstack/react-table";
import { Eye, RefreshCw, Pencil, Check } from "lucide-react";
import type { Agency, AgencyStatus, AgencyRequest} from "@/types/Agency";
import { formatToVNTime } from "@/lib/formatVNDate";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};
export const getStatusColor = (status: AgencyStatus) => {
  switch (status) {
    case "INACTIVE":
      return "bg-yellow-100 text-yellow-800";
    case "SUSPENDED":
      return "bg-blue-100 text-blue-800";
    case "BANNED":
      return "bg-red-100 text-red-800";
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
export const getStatusColorAgencyRequest = (status: "PENDING" | "APPROVED" | "REJECTED" ) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    case "APPROVED":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
export const agencyColumn = ({
  onView,
  onEdit,
}: {
  onView?: ({ id }: { id: string }) => void;
  onEdit?: ({ id }: { id: string }) => void;
}): ColumnDef<Agency>[] => [
  {
    accessorKey: "name",
    header: "Tên agency",
    cell: ({ row }) => {
      return row.original.name || "Không có";
    },
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
    cell: ({ row }) => {
      return row.original.station.address || "Không có";
    },
  },
    {
    accessorKey: "contact-phone",
    header: "SĐT",
    cell: ({ row }) => {
      return row.original.contactPhone || "Không có";
    },
  },
  {
    accessorKey: "station-name",
    header: "Tên trạm",
    cell: ({ row }) => {
      return row.original.station.name || "Không có";
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.original.status as AgencyStatus)}`}
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
export const agencyRequestColumn = ({
  onView,
  onApprove,
  onReject,
}: {
  onView?: ({ id }: { id: string }) => void;
  onApprove?: ({ id }: { id: string }) => void;
  onReject?: ({ id }: { id: string }) => void;
}): ColumnDef<AgencyRequest>[] => [
  {
    accessorKey: "name",
    header: "Tên agency",
    cell: ({ row }) => {
      return row.original.agencyName || "Không có";
    },
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
    cell: ({ row }) => {
      return row.original.agencyAddress || "Không có";
    },
  },
    {
    accessorKey: "contact-phone",
    header: "SĐT",
    cell: ({ row }) => {
      return row.original.agencyContactPhone || "Không có";
    },
  },
  {
    accessorKey: "station-name",
    header: "Tên trạm",
    cell: ({ row }) => {
      return row.original.stationName || "Không có";
    },
  },
  {
    accessorKey: "stationTotalCapacity",
    header: "Sức chứa",
    cell: ({ row }) => {
      return row.original.stationTotalCapacity || "Không có";
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColorAgencyRequest(row.original.status)}`}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Chấp nhận đơn"
                onClick={() => {
                  onApprove?.({ id: row.original.id });
                }}
              >
                <Check className="text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Chấp nhận</TooltipContent>
          </Tooltip>
        </div>        
      </div>
    ),
  },
];