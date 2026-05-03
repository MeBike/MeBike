import { ColumnDef } from "@tanstack/react-table";
import { Eye, ShieldAlert, CreditCard } from "lucide-react";
import type { AssetNFCCard, AssetStatus } from "@/types"; // Đảm bảo đường dẫn type đúng
import { formatToVNTime } from "@/lib/formatVNDate";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 1. Config màu sắc cho trạng thái NFC
export const getAssetStatusConfig = (status: AssetStatus) => {
  switch (status) {
    case "ACTIVE":
      return { label: "Đang hoạt động", color: "bg-green-100 text-green-700 border-green-200" };
    case "UNASSIGNED":
      return { label: "Chưa gán", color: "bg-blue-100 text-blue-700 border-blue-200" };
    case "BLOCKED":
      return { label: "Đã khóa", color: "bg-gray-100 text-gray-700 border-gray-200" };
    case "LOST":
      return { label: "Báo mất", color: "bg-red-100 text-red-700 border-red-200" };
    default:
      return { label: status, color: "bg-slate-100 text-slate-800" };
  }
};

export const nfcCardColumns = ({
  onView,
}: {
  onView?: ({ id }: { id: string }) => void;
}): ColumnDef<AssetNFCCard>[] => [
  {
    accessorKey: "uid",
    header: "Mã thẻ (UID)",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-mono text-sm font-bold">
        <CreditCard className="w-3 h-3 text-muted-foreground" />
        {row.original.uid}
      </div>
    ),
  },
  {
    accessorKey: "assigned_user",
    header: "Người sở hữu",
    cell: ({ row }) => {
      const user = row.original.assigned_user;
      if (!user) return <span className="text-muted-foreground italic text-xs">Chưa có chủ sở hữu</span>;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{user.fullname}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const { label, color } = getAssetStatusConfig(row.original.status);
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${color}`}>
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: "issued_at",
    header: "Ngày cấp",
    cell: ({ row }) => row.original.issued_at ? formatToVNTime(row.original.issued_at) : "Chưa gán",
  },
  {
    id: "special_dates",
    header: "Ghi chú thời gian",
    cell: ({ row }) => {
        const { blocked_at, lost_at } = row.original;
        if (lost_at) return <span className="text-xs text-red-600 font-medium">Mất: {formatToVNTime(lost_at)}</span>;
        if (blocked_at) return <span className="text-xs text-gray-500 italic">Khóa: {formatToVNTime(blocked_at)}</span>;
        return <span className="text-xs text-muted-foreground">Chưa có</span>;
    }
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView?.({ id: row.original.id })}
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Xem chi tiết thẻ</TooltipContent>
        </Tooltip>
      </div>
    ),
  },
];