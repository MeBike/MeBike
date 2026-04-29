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
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  VERIFIED: { 
    label: "Xác thực", 
    color: "bg-emerald-100 text-emerald-700 border-emerald-200" 
  },
  UNVERIFIED: { 
    label: "Chưa xác thực", 
    color: "bg-rose-100 text-rose-700 border-rose-200" 
  },
  BANNED: { 
    label: "Bị khóa", 
    color: "bg-slate-100 text-slate-700 border-slate-200" 
  },
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
    cell: ({ row }) => {
      const statusValue = row.original.verify || "";
      const config = STATUS_CONFIG[statusValue] || { 
        label: statusValue || "Không rõ", 
        color: "bg-muted text-muted-foreground border-border" 
      };

      return (
        <span
          className={`px-2.5 py-1 whitespace-nowrap border rounded-full text-xs font-semibold ${config.color}`}
        >
          {config.label}
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
    cell: ({ row }) => {
      const statusValue = row.original.verify || "";
      const config = STATUS_CONFIG[statusValue] || { 
        label: statusValue || "Không rõ", 
        color: "bg-muted text-muted-foreground border-border" 
      };

      return (
        <span
          className={`px-2.5 py-1 whitespace-nowrap border rounded-full text-xs font-semibold ${config.color}`}
        >
          {config.label}
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
