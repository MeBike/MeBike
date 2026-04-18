"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Coupon } from "@/types/Coupon"; // Đường dẫn tới file chứa interface của bạn
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";

interface CouponColumnProps {
  onView: (coupon: Coupon) => void;
  onEdit: (coupon: Coupon) => void;
}

export const couponColumns = ({ onView, onEdit }: CouponColumnProps): ColumnDef<Coupon>[] => [
  {
    accessorKey: "name",
    header: "Tên Coupon",
  },
  {
    accessorKey: "triggerType",
    header: "Loại kích hoạt",
  },
  {
    accessorKey: "discountValue",
    header: "Giá trị giảm",
    cell: ({ row }) => {
      const coupon = row.original;
      return `${coupon.discountValue} ${coupon.discountType === "PERCENTAGE" ? "%" : "VNĐ"}`;
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => onView(row.original)}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(row.original)}>
          <Edit className="w-4 h-4" />
        </Button>
      </div>
    ),
  },
];