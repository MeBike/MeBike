import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit2, Trash2 } from "lucide-react";
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
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
    cell: ({ row }) => row.original.address,
  },
  {
    accessorKey: "capacity",
    header: "Sức chứa",
    cell: ({ row }) => row.original.capacity.total,
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
                <button className="px-4 py-2 rounded border" type="button">
                  Hủy
                </button>
              </DialogClose>
              <DialogClose asChild>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded"
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
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
    cell: ({ row }) => row.original.address,
  },
  {
    accessorKey: "capacity",
    header: "Sức chứa",
    cell: ({ row }) => row.original.capacity.total,
  },
  {
    accessorKey: "stationType",
    header: "Loại trạm",
    cell: ({ row }) => row.original.stationType === "INTERNAL" ? "Trạm nội bộ" : "AGENCY",
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
