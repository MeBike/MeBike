import { ColumnDef } from "@tanstack/react-table";
import { Eye, RefreshCw, Wallet2 } from "lucide-react";
import { Wallet } from "@/types/wallet";
import { formatDateUTC } from "@/utils/formatDateTime";
export const getStatusColor = (status: Wallet["status"]) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "BLOCKED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};
export const walletColumn = ({
  onView,
  onEdit,
  onDeposit,
}: {
  onView?: ({ id }: { id: string }) => void;
  onEdit?: ({ id }: { id: string }) => void;
  onDeposit?: ({ id }: { id: string }) => void;
}): ColumnDef<Wallet>[] => [
  {
    accessorKey: "id",
    header: "Mã ví",
    cell: ({ row }) => {
      return shortenId(row.original.id) || "Không có";
    },
  },
  {
    accessorKey: "accountId",
    header: "Mã người dùng",
    cell: ({ row }) => {
      return shortenId(row.original.accountId) || "Không có";
    },
  },
  {
    accessorKey: "balance",
    header: "Số dư",
    cell: ({ row }) => {
      return `${row.original.balance?.toLocaleString("vi-VN") || 0}₫`;
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getStatusColor(row.original.status as Wallet["status"])}`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return <div className="whitespace-nowrap overflow-hidden text-ellipsis">{formatDateUTC(row.original.createdAt) || "Không có"}</div>;
    },
  },
  {
    accessorKey: "updated_at",
    header: "Cập nhật lần cuối",
    cell: ({ row }) => {
      return <div className="whitespace-nowrap overflow-hidden text-ellipsis">{formatDateUTC(row.original.updatedAt) || "Không có"}</div>;
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
        <button
          className="p-2 hover:bg-green-100 rounded-lg transition-colors"
          title="Giao dịch nạp tiền"
          onClick={() => {
            if (onDeposit) {
              onDeposit({ id: row.original.id });
            }
          }}
        >
          <Wallet2 className="w-4 h-4 text-green-600" />
        </button>
        <button
          title="Cập nhật trạng thái"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          onClick={() => {
            if (onEdit) {
              onEdit({ id: row.original.id });
            }
          }}
        >
          <RefreshCw className="w-4 h-4 text-blue-500" />
        </button>
      </div>
    ),
  },
];
