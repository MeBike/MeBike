import { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import type { UserRole } from "@/types";
import type { DetailUser } from "@/types";
import { formatToVNTime } from "@/lib/formatVNDate";

const getUserDisplayStatus = (user: { verify: string; accountStatus?: string }) => {
  return user.accountStatus === "BANNED" ? "BANNED" : user.verify;
};

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

export const userColumns = ({
  onView,
}: {
  onView?: ({ id }: { id: string }) => void;
}): ColumnDef<DetailUser>[] => [
  {
    accessorKey: "fullName",
    header: "Họ tên",
    cell: ({ row }) => {
      return row.original.fullName || "Không có";
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
    accessorKey: "phoneNumber",
    header: "Số điện thoại",
    cell: ({ row }) => {
      return row.original.phoneNumber || "Không có";
    },
  },
  {
    accessorKey: "role",
    header: "Vai trò",
    cell: ({ row }) => (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
          row.original.role
        )}`}
      >
        {row.original.role}
      </span>
    ),
  },
  {
    accessorKey: "verify",
    header: "Trạng thái xác thực",
    cell: ({ row }) => {
      const displayStatus = getUserDisplayStatus(row.original);

      return (
        <div className="flex justify-center items-center">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getVerifyStatusColor(
              displayStatus
            )}`}
          >
            {displayStatus}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      return formatToVNTime(row.original.createdAt);
    },
  },
  {
    accessorKey: "updated_at",
    header: "Ngày cập nhật",
    cell: ({ row }) => {
      return formatToVNTime(row.original.updatedAt);
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
      </div>
    ),
  },
];
