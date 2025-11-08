import { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import type { UserRole } from "@/types";
import type { DetailUser as ServiceDetailUser } from "@/services/auth.service";

export const getVerifyStatusColor = (status: string) => {
  switch (status) {
    case "VERIFIED":
      return "bg-green-100 text-green-800";
    case "UNVERIFIED":
      return "bg-yellow-100 text-yellow-800";
    case "BANNED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getRoleColor = (role: UserRole) => {
  switch (role) {
    case "ADMIN":
      return "bg-purple-100 text-purple-800";
    case "STAFF":
      return "bg-blue-100 text-blue-800";
    case "USER":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const shortenId = (id: string, start: number = 6, end: number = 4) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};

export const userColumns = (
  {
    onView,
  }: {
    onView?: ({ id }: { id: string }) => void;
  }
): ColumnDef<ServiceDetailUser>[] => [
  {
    accessorKey: "_id",
    header: "Mã người dùng",
    cell: ({ row }) => {
      return shortenId(row.original._id) || "Không có";
    },
  },
  {
    accessorKey: "fullname",
    header: "Họ tên",
    cell: ({ row }) => {
      return row.original.fullname || "Không có";
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return row.original.email || "Không có";
    },
  },
  {
    accessorKey: "phone_number",
    header: "Số điện thoại",
    cell: ({ row }) => {
      return row.original.phone_number || "Không có";
    },
  },
  {
    accessorKey: "role",
    header: "Vai trò",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(row.original.role)}`}
      >
        {row.original.role}
      </span>
    ),
  },
  {
    accessorKey: "verify",
    header: "Trạng thái xác thực",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getVerifyStatusColor(row.original.verify)}`}
      >
        {row.original.verify}
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
      </div>
    ),
  },
];