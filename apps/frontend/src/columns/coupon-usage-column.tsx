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
import {formatCurrency} from "@/utils/formatCurrency";
import { formatToVNTime } from "@/lib/formatVNDate";

export const couponUsageLogColumns = (): ColumnDef<CouponUsageLog>[] => [
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
    cell: ({ row }) => `${formatCurrency(row.original.couponDiscountAmount)}`,
  },
  {
    accessorKey: "totalAmount",
    header: "Tổng tiền",
    cell: ({ row }) => `${formatCurrency(row.original.totalAmount)}`,
  },
  {
    accessorKey: "startTime",
    header: "Thời gian bắt đầu",
    cell: ({ row }) => formatToVNTime(row.original.startTime),
  },
];