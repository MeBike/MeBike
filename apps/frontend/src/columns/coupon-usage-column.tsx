"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CouponUsageLog } from "@/types/Coupon";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UsageLogColumnProps {
  onView: (log: CouponUsageLog) => void;
}

export const couponUsageLogColumns = ({
  onView,
}: UsageLogColumnProps): ColumnDef<CouponUsageLog>[] => [
  {
    accessorKey: "rentalId",
    header: "Mã thuê xe",
  },
  {
    accessorKey: "userId",
    header: "Mã người dùng",
  },
  {
    accessorKey: "couponRuleName",
    header: "Tên Coupon",
  },
  {
    accessorKey: "couponDiscountAmount",
    header: "Số tiền giảm",
    cell: ({ row }) => `${row.original.couponDiscountAmount.toLocaleString()} VNĐ`,
  },
  {
    accessorKey: "totalAmount",
    header: "Tổng tiền",
    cell: ({ row }) => `${row.original.totalAmount.toLocaleString()} VNĐ`,
  },
  {
    accessorKey: "startTime",
    header: "Thời gian bắt đầu",
    cell: ({ row }) => new Date(row.original.startTime).toLocaleString("vi-VN"),
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <div className="flex items-center pl-4.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onView?.(row.original)}
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Xem chi tiết log</TooltipContent>
        </Tooltip>
      </div>
    ),
  },
];