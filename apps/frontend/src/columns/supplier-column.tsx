import { ColumnDef } from "@tanstack/react-table";
import { Eye, Recycle } from "lucide-react";
import type { Supplier } from "@/types";
const getStatusColor = (status: "ACTIVE" | "INACTIVE" | "TERMINATED" | "") => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "INACTIVE":
      return "bg-red-100 text-red-800";
    case "TERMINATED":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const columns = ({
  onView,
  onChangeStatus,
}: {
  onView?: (supplier: Supplier) => void;
  onChangeStatus?: (id: string, newStatus: "ACTIVE" | "INACTIVE" | "TERMINATED") => void;
}): ColumnDef<Supplier>[] => [
  {
    accessorKey: "name",
    header: "Tên nhà cung cấp",
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
  },
  {
    accessorKey: "phoneNumber",
    header: "Số điện thoại",
    cell: ({ row }) => row.original.phoneNumber,
  },
  {
    accessorKey: "contractFee",
    header: "Phí hợp đồng",
    cell: ({ row }) => `${row.original.contractFee}`,
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
              onView(row.original);
            }
          }}
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title={
            row.original.status === "ACTIVE" ? "Ngưng hoạt động" : "Kích hoạt"
          }
          onClick={() => {
            if (onChangeStatus) {
              onChangeStatus(
                row.original.id,
                row.original.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
              );
            }
          }}
        >
          <Recycle className="w-4 h-4 text-blue-500" />
        </button>
      </div>
    ),
  },
];
