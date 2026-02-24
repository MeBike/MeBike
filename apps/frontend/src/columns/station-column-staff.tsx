import { ColumnDef } from "@tanstack/react-table";
import type { Station } from "@custom-types";
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
export const stationColumns = (): ColumnDef<Station>[] => [
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
    cell: ({ row }) => formatDateVN(row.original.createdAt),
  },
  {
    accessorKey: "updated_at",
    header: "Ngày cập nhật",
    cell: ({ row }) => formatDateVN(row.original.updatedAt),
  },
];
