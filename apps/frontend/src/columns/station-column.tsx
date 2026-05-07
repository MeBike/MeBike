import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit2, Trash2, AlertTriangle } from "lucide-react"; // Thêm icon AlertTriangle
import type { Station } from "@custom-types";
import { formatToVNTime } from "@/lib/formatVNDate";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export const stationColumns = ({
  onEdit,
  onDelete,
}: {
  onEdit?: ({ id }: { id: string }) => void;
  onDelete?: ({ id }: { id: string }) => void;
}): ColumnDef<Station>[] => [
  {
    accessorKey: "name",
    header: "Tên trạm",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "capacity",
    header: "Sức chứa",
    cell: ({ row }) => row.original.capacity.total,
  },
  {
    accessorKey: "bikes",
    header: "Số xe hiện tại",
    cell: ({ row }) => {
      const currentBikes = row.original.bikes.total;
      const needsRedistribution = currentBikes < 10;
      return (
        <div className="flex items-center gap-2">
          <span className={needsRedistribution ? "font-bold text-orange-600" : "font-medium"}>
            {currentBikes}
          </span>
          {needsRedistribution && (
            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
              <AlertTriangle className="w-3 h-3" />
              Cần điều phối
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => formatToVNTime(row.original.createdAt),
  },
  {
    accessorKey: "updated_at",
    header: "Ngày cập nhật",
    cell: ({ row }) => formatToVNTime(row.original.updatedAt),
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          href={`/admin/stations/${row.original.id}`}
          className="p-2 hover:bg-muted rounded-lg transition-colors inline-flex"
          title="Xem chi tiết"
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </Link>
        <button
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Chỉnh sửa"
          onClick={() => {
            if (onEdit) {
              onEdit({ id: row.original.id });
            }
          }}
        >
          <Edit2 className="w-4 h-4 text-muted-foreground" />
        </button>
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Xóa"
              type="button"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bạn có chắc muốn xóa trạm này?</DialogTitle>
            </DialogHeader>
            <div>
              Tên trạm: <b>{row.original.name}</b>
            </div>
            <DialogFooter className="gap-2 flex">
              <DialogClose asChild>
                <button className="px-4 py-2 rounded border hover:bg-muted" type="button">
                  Hủy
                </button>
              </DialogClose>
              <DialogClose asChild>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  type="button"
                  onClick={() => {
                    if (onDelete) onDelete({ id: row.original.id });
                  }}
                >
                  Xóa
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    ),
  },
];

export const stationStaffColumns = ({
  onView,
  onEdit,
  onDelete,
}: {
  onView?: ({ id }: { id: string }) => void;
  onEdit?: ({ id }: { id: string }) => void;
  onDelete?: ({ id }: { id: string }) => void;
}): ColumnDef<Station>[] => [
  {
    accessorKey: "name",
    header: "Tên trạm",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "capacity",
    header: "Sức chứa",
    cell: ({ row }) => row.original.capacity.total,
  },
  {
    accessorKey: "bikes",
    header: "Số xe hiện tại",
    cell: ({ row }) => {
      const currentBikes = row.original.bikes.total;
      const needsRedistribution = currentBikes < 10;

      return (
        <div className="flex items-center gap-2">
          <span className={needsRedistribution ? "font-bold text-orange-600" : "font-medium"}>
            {currentBikes}
          </span>
          {needsRedistribution && (
            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
              <AlertTriangle className="w-3 h-3" />
              Cần điều phối
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stationType",
    header: "Loại trạm",
    cell: ({ row }) => (
      <span className={row.original.stationType === "INTERNAL" ? "text-blue-600 font-medium" : "text-purple-600 font-medium"}>
        {row.original.stationType === "INTERNAL" ? "Trạm nội bộ" : "Trạm đối tác"}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => formatToVNTime(row.original.createdAt),
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