import { ColumnDef } from "@tanstack/react-table";
import { Eye, Wallet } from "lucide-react";
import type { UserRole } from "@/types";
import type { DetailUser } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
const getUserDisplayStatus = (user: {
  verify: string;
  accountStatus?: string;
}) => {
  return user.accountStatus === "BANNED" ? "BANNED" : user.verify;
};
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Quản trị viên",
  MANAGER: "Quản lý trạm",
  STAFF: "Nhân viên trạm",
  TECHNICIAN: "Kỹ thuật viên",
  AGENCY: "Agency",
  USER: "Khách hàng",
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

export const getRoleColor = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-purple-100 text-purple-800";
    case "MANAGER":
      return "bg-teal-100 text-teal-800";
    case "STAFF":
      return "bg-blue-100 text-blue-800";
    case "TECHNICIAN":
      return "bg-orange-100 text-orange-800";
    case "AGENCY":
      return "bg-cyan-100 text-cyan-800";
    case "USER":
      return "bg-indigo-100 text-indigo-800";
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
  onViewWallet,
}: {
  onView?: ({ id }: { id: string }) => void;
  onViewWallet?: ({id} : {id:string}) => void;
}): ColumnDef<DetailUser>[] => [
  {
    accessorKey: "fullName",
    header: "Họ tên",
    meta: {
      thClassName: "w-[17%]",
      tdClassName: "max-w-0",
    },
    cell: ({ row }) => {
      const name = row.original.fullName || "Không có";
      return (
        <div className="truncate" title={name}>
          {name}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    meta: {
      thClassName: "w-[30%]",
      tdClassName: "max-w-0",
    },
    cell: ({ row }) => {
      const email = row.original.email || "Không có";
      return (
        <div className="truncate" title={email}>
          {email}
        </div>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Số điện thoại",
    meta: {
      thClassName: "w-[15%]",
      tdClassName: "max-w-0 whitespace-nowrap",
    },
    cell: ({ row }) => {
      return row.original.phoneNumber || "Không có";
    },
  },
  {
    accessorKey: "role",
    header: "Vai trò",
    meta: {
      thClassName: "w-[12%]",
      tdClassName: "whitespace-nowrap",
    },
    cell: ({ row }) => (
      <span
        className={`inline-flex px-1 py-1 rounded-full text-xxs font-medium ${getRoleColor(
          row.original.role,
        )}`}
      >
        {ROLE_LABELS[row.original.role]}
      </span>
    ),
  },
  {
    accessorKey: "verify",
    header: "Trạng thái",
    meta: {
      thClassName: "w-[14%]",
      tdClassName: "whitespace-nowrap",
    },
    cell: ({ row }) => {
      const displayStatus = getUserDisplayStatus(row.original);
      return (
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getVerifyStatusColor(
            displayStatus,
          )}`}
        >
          {displayStatus}
        </span>
      );
    },
  },
  // {
  //   accessorKey: "created_at",
  //   header: "Ngày tạo",
  //   cell: ({ row }) => {
  //     return formatToVNTime(row.original.createdAt);
  //   },
  // },
  // {
  //   accessorKey: "updated_at",
  //   header: "Ngày cập nhật",
  //   cell: ({ row }) => {
  //     return formatToVNTime(row.original.updatedAt);
  //   },
  // },
  {
    id: "actions",
    header: "Hành động",
    meta: {
      thClassName: "w-[12%]",
      tdClassName: "whitespace-nowrap",
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-0">
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Xem chi tiết"
                  onClick={() => {
                    onView?.({ id: row.original.id });
                  }}
                >
                  <Eye className="text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xem chi tiết</TooltipContent>
            </Tooltip>
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Xem chi tiết"
                  onClick={() => {
                    onViewWallet?.({ id: row.original.id });
                  }}
                >
                  <Wallet className="text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Lịch sử giao dịch</TooltipContent>
            </Tooltip>
          </div>
        </div>
      );
    },
  },
];
export const userColumnsStaff = ({
  onView,
  onViewWallet,
}: {
  onView?: ({ id }: { id: string }) => void;
  onViewWallet?: ({id} : {id:string}) => void;
}): ColumnDef<DetailUser>[] => [
  {
    accessorKey: "fullName",
    header: "Họ tên",
    meta: {
      thClassName: "w-[17%]",
      tdClassName: "max-w-0",
    },
    cell: ({ row }) => {
      const name = row.original.fullName || "Không có";
      return (
        <div className="truncate" title={name}>
          {name}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    meta: {
      thClassName: "w-[30%]",
      tdClassName: "max-w-0",
    },
    cell: ({ row }) => {
      const email = row.original.email || "Không có";
      return (
        <div className="truncate" title={email}>
          {email}
        </div>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Số điện thoại",
    meta: {
      thClassName: "w-[15%]",
      tdClassName: "max-w-0 whitespace-nowrap",
    },
    cell: ({ row }) => {
      return row.original.phoneNumber || "Không có";
    },
  },
  {
    accessorKey: "role",
    header: "Vai trò",
    meta: {
      thClassName: "w-[12%]",
      tdClassName: "whitespace-nowrap",
    },
    cell: ({ row }) => (
      <span
        className={`inline-flex px-1 py-1 rounded-full text-xxs font-medium ${getRoleColor(
          row.original.role,
        )}`}
      >
        {row.original.role}
      </span>
    ),
  },
  {
    accessorKey: "verify",
    header: "Trạng thái",
    meta: {
      thClassName: "w-[14%]",
      tdClassName: "whitespace-nowrap",
    },
    cell: ({ row }) => {
      const displayStatus = getUserDisplayStatus(row.original);
      return (
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getVerifyStatusColor(
            displayStatus,
          )}`}
        >
          {displayStatus}
        </span>
      );
    },
  },
  // {
  //   accessorKey: "created_at",
  //   header: "Ngày tạo",
  //   cell: ({ row }) => {
  //     return formatToVNTime(row.original.createdAt);
  //   },
  // },
  // {
  //   accessorKey: "updated_at",
  //   header: "Ngày cập nhật",
  //   cell: ({ row }) => {
  //     return formatToVNTime(row.original.updatedAt);
  //   },
  // },
  {
    id: "actions",
    header: "Hành động",
    meta: {
      thClassName: "w-[12%]",
      tdClassName: "whitespace-nowrap",
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-0">
          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Xem chi tiết"
                  onClick={() => {
                    onView?.({ id: row.original.id });
                  }}
                >
                  <Eye className="text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Xem chi tiết</TooltipContent>
            </Tooltip>
          </div>
        </div>
      );
    },
  },
];
