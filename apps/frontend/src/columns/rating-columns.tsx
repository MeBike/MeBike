import { ColumnDef } from "@tanstack/react-table";
import { Eye, Star } from "lucide-react";
import { formatDateOnlyVN } from "@/utils/dateFormat";
import type { Rating } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Đảm bảo đúng path component của bạn
import { Button } from "@/components/ui/button";

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
    meta: {
      thClassName: "text-center",
      tdClassName: "text-center",
    },
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 flex items-center justify-center"
                onClick={() => onView?.({ id: row.original.id })}
              >
                <Eye className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Xem chi tiết đánh giá</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
  },
];