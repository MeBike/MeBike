import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { SOS } from "@/types/SOS";

interface SOSColumnsProps {
  onView: (sos: SOS) => void;
}

export const sosColumns = ({ onView }: SOSColumnsProps): ColumnDef<SOS>[] => [
  {
    accessorKey: "_id",
    header: "Mã SOS",
    cell: ({ row }) => {
      const id = row.getValue("_id") as string;
      return (
        <div className="font-mono text-sm">
          {id.slice(0, 8)}
        </div>
      );
    },
  },
  {
    accessorKey: "requester_id",
    header: "Mã người dùng",
    cell: ({ row }) => {
      const requesterId = row.getValue("requester_id") as string;
      return (
        <div className="font-mono text-sm">
          {requesterId.slice(0, 8)}
        </div>
      );
    },
  },
  {
    accessorKey: "bike_id",
    header: "Mã xe đạp",
    cell: ({ row }) => {
      const bikeId = row.getValue("bike_id") as string;
      return (
        <div className="font-mono text-sm">
          {bikeId.slice(0, 8)}
        </div>
      );
    },
  },
  {
    accessorKey: "issue",
    header: "Vấn đề",
    cell: ({ row }) => {
      const issue = row.getValue("issue") as string;
      return (
        <div className="max-w-[250px] truncate text-sm" title={issue}>
          {issue}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant =
        status === "ĐÃ XỬ LÍ"
          ? "success"
          : status === "ĐANG CHỜ XỬ LÍ"
            ? "pending"
            : status === "KHÔNG XỬ LÍ ĐƯỢC"
              ? "warning"
              : "destructive";
      return (
        <Badge variant={variant} className="capitalize">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return (
        <div className="text-sm">
          {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => {
      const sos = row.original;
      return (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onView(sos)}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          Xem chi tiết
        </Button>
      );
    },
  },
];
