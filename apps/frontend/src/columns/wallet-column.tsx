import { ColumnDef } from "@tanstack/react-table";
import { Eye, RefreshCw, Wallet2 } from "lucide-react";
import { Wallet } from "@/services/wallet.service";
export const getStatusColor = (status: Wallet["status"]) => {
  switch (status) {
    case "ĐANG HOẠT ĐỘNG":
      return "bg-green-100 text-green-800";
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
    accessorKey: "_id",
    header: "Mã ví",
    cell: ({ row }) => {
      return shortenId(row.original._id) || "Không có";
    },
  },
  {
    accessorKey: "user_id",
    header: "Mã người dùng",
    cell: ({ row }) => {
      return shortenId(row.original.user_id) || "Không có";
    },
  },
  {
    accessorKey: "fullname",
    header: "Họ và tên",
    cell: ({ row }) => {
      return row.original.fullname || "Không có";
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
        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.original.status as Wallet["status"])}`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return (
        new Date(row.original.created_at).toLocaleDateString("vi-VN") ||
        "Không có"
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: "Cập nhật lần cuối",
    cell: ({ row }) => {
      return (
        new Date(row.original.updated_at).toLocaleDateString("vi-VN") ||
        "Không có"
      );
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
              onView({ id: row.original._id });
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
              onDeposit({ id: row.original._id });
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
              onEdit({ id: row.original._id });
            }
          }}
        >
          <RefreshCw className="w-4 h-4 text-blue-500" />
        </button>
      </div>
    ),
  },
];
