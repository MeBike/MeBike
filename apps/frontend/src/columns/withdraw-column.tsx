import { ColumnDef } from "@tanstack/react-table";
import { Eye, RefreshCw } from "lucide-react";
import type { WithdrawRequest, WithdrawStatus } from "@/types";
export const getStatusColor = (status: WithdrawStatus) => {
  switch (status) {
    case "ĐANG CHỜ XỬ LÝ":
      return "bg-yellow-100 text-yellow-800";
    case "ĐÃ DUYỆT":
      return "bg-blue-100 text-blue-800";
    case "TỪ CHỐI":
      return "bg-red-100 text-red-800";
    case "ĐÃ HOÀN THÀNH":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};
export const withdrawColumn = ({
  onView,
  onUpdateStatus,
}: {
  onView?: ({ id }: { id: string }) => void;
  onUpdateStatus?: ((withDrawRequest: WithdrawRequest) => void) | undefined;
}): ColumnDef<WithdrawRequest>[] => [
  {
    accessorKey: "_id",
    header: "Mã hoàn tiền",
    cell: ({ row }) => {
      return shortenId(row.original._id);
    },
  },
  {
    accessorKey: "user_id",
    header: "Mã người dùng",
    cell: ({ row }) => row.original.user_id,
  },
  {
    accessorKey: "amount",
    header: "Số tiền",
    cell: ({ row }) => `${row.original.amount} VND`,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.original.status)}`}
      >
        {row.original.status}
      </span>
    ),
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
        <button
          title="Cập nhật trạng thái"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          onClick={() => onUpdateStatus?.(row.original)}
        >
          <RefreshCw className="w-4 h-4 text-blue-500" />
        </button>
      </div>
    ),
  },
];
