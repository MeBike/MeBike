"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Coupon, Status } from "@/types/Coupon"; // Đường dẫn tới file chứa interface của bạn
import { Button } from "@/components/ui/button";
import { Eye, Power, EyeOff , PowerOff} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
interface CouponColumnProps {
  onView: (coupon: Coupon) => void;
  onActive: (coupon: Coupon) => void;
  onDeactive: (coupon: Coupon) => void;
}
export const getStatusColor = (status: Status) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "INACTIVE":
      return "bg-blue-100 text-blue-800";
    case "SUSPENDED":
      return "bg-yellow-100 text-yellow-800";
    case "BANNED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
export const couponColumns = ({
  onView,
  onActive,
  onDeactive,
}: CouponColumnProps): ColumnDef<Coupon>[] => [
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
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.original.status as Status)}`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    id: "actions",
    header:"Hành động",
    cell: ({ row }) => (
      // <div className="flex gap-2">
      //   <Button variant="ghost" size="icon" onClick={() => onView(row.original)}>
      //     <Eye className="w-4 h-4" />
      //   </Button>
      //   {row.original.status === "ACTIVE" ? (
      //     <Button variant="ghost" size="icon" onClick={() => onDeactive(row.original)}>
      //       <Edit className="w-4 h-4" />
      //     </Button>
      //   ) : (
      //     <Button variant="ghost" size="icon" onClick={() => onActive(row.original)}>
      //       <Edit className="w-4 h-4" />
      //     </Button>
      //   )}
      // </div>
      <div className="flex items-center gap-0">
        <div className="">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Xem chi tiết"
                onClick={() => onView?.(row.original)}
              >
                <Eye className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Xem chi tiết</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              {row.original.status === "ACTIVE" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeactive(row.original)}
                  className="text-destructive" // Đổi màu đỏ nếu muốn cảnh báo deactive
                >
                  <PowerOff className="w-4 h-4" />{" "}
                  {/* Dùng EyeOff hoặc PowerOff cho deactive */}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onActive(row.original)}
                  className="text-emerald-600"
                >
                  <Power className="w-4 h-4" />{" "}
                  {/* Dùng Power hoặc CheckCircle cho active */}
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent>
              {row.original.status === "ACTIVE" ? "Hủy kích hoạt" : "Kích hoạt"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    ),
  },
];
