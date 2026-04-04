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
  // {
  //   accessorKey: "id",
  //   header: "Mã đánh giá",
  //   cell: ({ row }) => {
  //     return shortenId(row.original.id);
  //   },
  // },
  {
    accessorKey: "user",
    header: "Người dùng",
    cell: ({ row }) => row.original.user?.fullName || "Không có tên người dùng",
  },
  {
    accessorKey: "rental_id",
    header: "Mã đơn thuê",
    cell: ({ row }) => shortenId(row.original.rentalId),
  },
  {
    accessorKey: "bike-score",
    header: "Đánh giá xe đạp",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span className="font-medium">{row.original.bikeScore}</span>
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      </div>
    ),
  },
  {
    accessorKey: "station-score",
    header: "Đánh giá trạm",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span className="font-medium">{row.original.stationScore}</span>
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
      return formatDateOnlyVN(row.original.createdAt);
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
              onView({ id: row.original.id });
            }
          }}
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    ),
  },
];