import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit2,  Recycle } from "lucide-react";
import type { Supplier } from "@/types/supplier.type";
import { formatToVNTime } from "@/lib/formateVNDate";
const getStatusColor = (status: "Active" | "Inactive") => {
  return status === "Active"
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
  onChangeStatus?: (
    id: string,
    newStatus: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG"
  ) => void;
}): ColumnDef<Supplier>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => row.original.id,
  },
  {
    accessorKey: "name",
    header: "Tên nhà cung cấp",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "contact_info",
    header: "Địa chỉ",
    cell: ({ row }) => row.original.contactInfo.address,
  },
  {
    accessorKey: "contact_info.phone_number",
    header: "Số điện thoại",
    cell: ({ row }) => row.original.contactInfo.phone,
  },
  {
    accessorKey: "contract_fee",
    header: "Phí hợp đồng",
    cell: ({ row }) => `${row.original.contactFee}`,
  },
  {
    accessorKey: "createdAt",
    header: "Ngày được tạo",
    cell: ({ row }) => `${formatToVNTime(row.original.createdAt)}`,
  },
  {
    accessorKey: "createdAt",
    header: "Ngày được cập nhật",
    cell: ({ row }) => `${formatToVNTime(row.original.updatedAt)}`,
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
          title={
            row.original.status === "Active"
              ? "Ngưng hoạt động"
              : "Kích hoạt"
          }
          onClick={() => {
            if (onChangeStatus) {
              onChangeStatus(
                row.original.id,
                row.original.status === "Active"
                  ? "NGƯNG HOẠT ĐỘNG"
                  : "HOẠT ĐỘNG"
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
