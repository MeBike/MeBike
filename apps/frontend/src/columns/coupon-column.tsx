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
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { 
    label: "Đang hoạt động", 
    color: "bg-emerald-100 text-emerald-700 border-emerald-200" 
  },
  INACTIVE: { 
    label: "Không hoạt động", 
    color: "bg-rose-100 text-rose-700 border-rose-200" 
  },
  TERMINATED: { 
    label: "Đã kết thúc", 
    color: "bg-slate-100 text-slate-700 border-slate-200" 
  },
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
    cell: ({ row }) => {
      const statusValue = row.original.status || "";
      const config = STATUS_CONFIG[statusValue] || { 
        label: statusValue || "Không rõ", 
        color: "bg-muted text-muted-foreground border-border" 
      };

      return (
        <span
          className={`px-2.5 py-1 whitespace-nowrap border rounded-full text-xs font-semibold ${config.color}`}
        >
          {config.label}
        </span>
      );
    },
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
          {/* <Tooltip>
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
          </Tooltip> */}
          <Tooltip>
            <TooltipTrigger asChild>
              {row.original.status === "ACTIVE" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeactive(row.original)}
                  className="text-destructive"
                >
                  <PowerOff className="w-4 h-4" />{" "}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onActive(row.original)}
                  className="text-emerald-600"
                >
                  <Power className="w-4 h-4" />{" "}
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
