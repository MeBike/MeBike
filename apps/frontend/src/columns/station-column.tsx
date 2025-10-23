import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit2, Trash2 } from "lucide-react";
import type { Station } from "@custom-types";
const getStatusColor = (status: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG") => {
  return status === "HOẠT ĐỘNG"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
};
export function formatDateVN(dateString: string) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ""; // Nếu date không hợp lệ trả về rỗng
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
export const stationColumns = ({
  onView,
  setIsDetailModalOpen,
  onEdit,
  onDelete,
}: {
  onView?: (supplier: Station) => void;
  setIsDetailModalOpen?: (isOpen: boolean) => void;
  onEdit?: (supplier: Station) => void;
  onDelete?: (supplier: Station) => void;
}): ColumnDef<Station>[] => [
  {
    accessorKey: "name",
    header: "Tên trạm",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
    cell: ({ row }) => row.original.address,
  },
  {
    accessorKey: "latitude",
    header: "Vĩ độ",
    cell: ({ row }) => row.original.latitude,
  },
  {
    accessorKey: "longitude",
    header: "Kinh độ",
    cell: ({ row }) => row.original.longitude,
  },
  {
    accessorKey: "capacity",
    header: "Sức chứa",
    cell: ({ row }) => row.original.capacity,
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => formatDateVN(row.original.created_at),
  },
  {
    accessorKey: "updated_at",
    header: "Ngày cập nhật",
    cell: ({ row }) => formatDateVN(row.original.updated_at),
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
              onView(row.original);
            }
            if (setIsDetailModalOpen) {
              setIsDetailModalOpen(true);
            }
          }}
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Chỉnh sửa"
          onClick={() => {
            if (onEdit) {
              onEdit(row.original);
            }
          }}
        >
          <Edit2 className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Xóa"
          onClick={() => {
            if (onDelete) {
              onDelete(row.original);
            }
          }}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    ),
  },
];
