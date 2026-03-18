import { ColumnDef } from "@tanstack/react-table";
import type { Station } from "@custom-types";
import { formatToVNTime } from "@/lib/formatVNDate";
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
    cell: ({ row }) => formatToVNTime(row.original.createdAt),
  },
  {
    accessorKey: "updated_at",
    header: "Ngày cập nhật",
    cell: ({ row }) => formatToVNTime(row.original.updatedAt),
  },
];
