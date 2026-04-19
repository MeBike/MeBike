"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatsByRuleItem } from "@/types/Coupon"; // Import interface của bạn

export const ruleStatsColumns: ColumnDef<StatsByRuleItem>[] = [
  {
    accessorKey: "name",
    header: "Tên quy tắc",
  },
  {
    accessorKey: "triggerType",
    header: "Loại kích hoạt",
  },
  {
    accessorKey: "discountValue",
    header: "Giá trị giảm",
    cell: ({ row }) => {
      const item = row.original;
      return `${item.discountValue} ${item.discountType === "PERCENTAGE" ? "%" : "VNĐ"}`;
    },
  },
  {
    accessorKey: "appliedCount",
    header: "Số lượt áp dụng",
  },
  {
    accessorKey: "totalDiscountAmount",
    header: "Tổng tiền đã giảm",
    cell: ({ row }) => {
      const amount = row.original.totalDiscountAmount;
      return amount.toLocaleString("vi-VN") + " VNĐ";
    },
  },
  {
    accessorKey: "source",
    header: "Nguồn",
  },
];