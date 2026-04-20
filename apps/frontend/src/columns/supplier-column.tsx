import { ColumnDef } from "@tanstack/react-table";
import { Eye, Recycle } from "lucide-react";
import type { Supplier } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
const getStatusColor = (status: "ACTIVE" | "INACTIVE" | "TERMINATED" | "") => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "INACTIVE":
      return "bg-red-100 text-red-800";
    case "TERMINATED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-muted text-muted-foreground";
  }
};
import { formatToVNTime } from "@/lib/formatVNDate";
export const columns = ({
  onView,
  onChangeStatus,
}: {
  onView?: (supplier: Supplier) => void;
  onChangeStatus?: (id: string, newStatus: "ACTIVE" | "INACTIVE" | "TERMINATED") => void;
}): ColumnDef<Supplier>[] => [
  {
    accessorKey: "name",
    header: "Tên nhà cung cấp",
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
  },
  {
    accessorKey: "phoneNumber",
    header: "Số điện thoại",
    cell: ({ row }) => row.original.phoneNumber,
  },
  {
    accessorKey: "contractFee",
    header: "Phí hợp đồng",
    cell: ({ row }) => `${row.original.contractFee}`,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.original.status)}`}
      >
        {row.original.status}
      </span>
    ),
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
                  onView?.(row.original);
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
