import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit } from "lucide-react";
import type { Report } from "@/services/report.service";

interface ReportColumnsProps {
  onView: (report: Report) => void;
  onUpdate: (report: Report) => void;
}

export const reportColumns = ({
  onView,
  onUpdate,
}: ReportColumnsProps): ColumnDef<Report>[] => [
  {
    accessorKey: "type",
    header: "Loại báo cáo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant="outline" className="capitalize">
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "message",
    header: "Nội dung",
    cell: ({ row }) => {
      const message = row.getValue("message") as string;
      return (
        <div className="max-w-[200px] truncate" title={message}>
          {message}
        </div>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Ưu tiên",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      const variant =
        priority === "HIGH"
          ? "destructive"
          : priority === "MEDIUM"
          ? "default"
          : "secondary";
      return (
        <Badge variant={variant} className="capitalize">
          {priority === "HIGH" ? "Cao" : priority === "MEDIUM" ? "Trung bình" : "Thấp"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant =
        status === "ĐANG CHỜ XỬ LÝ"
          ? "default"
          : status === "IN_PROGRESS"
            ? "success"
            : status === "RESOLVED"
              ? "secondary"
              : "destructive";
      return (
        <Badge variant={variant} className="capitalize">
          {status === "ĐANG CHỜ XỬ LÝ"
            ? "ĐANG CHỜ XỬ LÝ"
            : status === "IN_PROGRESS"
              ? "ĐANG XỬ LÝ"
              : status === "RESOLVED"
                ? "ĐÃ GIẢI QUYẾT"
                : "ĐÃ HỦY"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return new Date(date).toLocaleDateString("vi-VN");
    },
  },
  {
    accessorKey: "updated_at",
    header: "Cập nhật cuối",
    cell: ({ row }) => {
      const date = row.getValue("updated_at") as string;
      return new Date(date).toLocaleDateString("vi-VN");
    },
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const report = row.original;

      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(report)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Xem
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUpdate(report)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Cập nhật
          </Button>
        </div>
      );
    },
  },
];