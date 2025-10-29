import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit2,  Recycle } from "lucide-react";
import type { Supplier } from "@/types";
const getStatusColor = (status: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG") => {
  return status === "HOẠT ĐỘNG"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
};

export const columns = ({
  onView,
  setIsDetailModalOpen,
  onEdit,
  onChangeStatus,
}: {
  onView?: (supplier: Supplier) => void;
  setIsDetailModalOpen?: (isOpen: boolean) => void;
  onEdit?: (data: Supplier) => void;
  onChangeStatus?: (id: string, newStatus: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG") => void;
}): ColumnDef<Supplier>[] => [
  {
    accessorKey: "name",
    header: "Tên nhà cung cấp",
  },
  {
    accessorKey: "contact_info.address",
    header: "Địa chỉ",
    cell: ({ row }) => row.original.contact_info.address,
  },
  {
    accessorKey: "contact_info.phone_number",
    header: "Số điện thoại",
    cell: ({ row }) => row.original.contact_info.phone_number,
  },
  {
    accessorKey: "contract_fee",
    header: "Phí hợp đồng",
    cell: ({ row }) => `${row.original.contract_fee} VND`,
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
          title={row.original.status === "HOẠT ĐỘNG" ? "Ngưng hoạt động" : "Kích hoạt"}
          onClick={() => {
            if (onChangeStatus) {
              onChangeStatus(row.original._id, row.original.status === "HOẠT ĐỘNG" ? "NGƯNG HOẠT ĐỘNG" : "HOẠT ĐỘNG");
            }
          }}
        >
          <Recycle className="w-4 h-4 text-blue-500" />
        </button>
      </div>
    ),
  },
];
