import { ColumnDef } from "@tanstack/react-table";
import { Eye, Star } from "lucide-react";
import { formatDateOnlyVN } from "@/utils/dateFormat";
import type { Rating } from "@/types";

export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};

export const ratingColumn = ({
  onView,
}: {
  onView?: ({ id }: { id: string }) => void;
}): ColumnDef<Rating>[] => [
  {
    accessorKey: "_id",
    header: "Mã đánh giá",
    cell: ({ row }) => {
      return shortenId(row.original._id);
    },
  },
  {
    accessorKey: "user",
    header: "Người dùng",
    cell: ({ row }) => row.original.user?.fullname || "Không có tên người dùng",
  },
  {
    accessorKey: "rental_id",
    header: "Mã đơn thuê",
    cell: ({ row }) => shortenId(row.original.rental_id),
  },
  {
    accessorKey: "rating",
    header: "Đánh giá",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span className="font-medium">{row.original.rating}</span>
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      </div>
    ),
  },
  {
    accessorKey: "comment",
    header: "Bình luận",
    cell: ({ row }) => (
      <div className="max-w-xs truncate">
        {row.original.comment || "Không có bình luận"}
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return formatDateOnlyVN(row.original.created_at);
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
      </div>
    ),
  },
];