import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye } from "lucide-react";
import type { Report } from "@custom-types";
import { formatDateUTC } from "@/utils/formatDateTime";
import type { DetailUser } from "@/services/auth.service";

interface ReportColumnsProps {
  onView: (report: Report) => void;
  onUpdate: (report: Report) => void;
  staffList: DetailUser[];
}

export const reportColumns = ({
  onView,
  onUpdate,
  staffList,
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
          {message || "Không có lời nhắn"}
        </div>
      );
    },
  },
  {
    accessorKey: "priority",
    header: "Ưu tiên",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      if (priority === "") {
        return <Badge variant="secondary">KHÔNG XÁC ĐỊNH</Badge>;
      }
      const variant =
        priority === "KHẨN CẤP"
          ? "destructive"
          : priority === "CAO"
            ? "warning"
            : priority === "BÌNH THƯỜNG"
              ? "pending"
              : "success";
      return (
        <Badge variant={variant} className="capitalize">
          {priority}
        </Badge>
      );
    },
  },
  {
    accessorKey: "assignee_id",
    header: "Người được giao",
    cell: ({ row }) => {
      const assigneeId = row.getValue("assignee_id") as string;
      if (!assigneeId) return <div>Chưa có</div>;
      const staff = staffList.find(s => s._id === assigneeId);
      return <div>{staff ? `${staff.fullname} (${staff.email})` : assigneeId}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusMap: Record<string, string> = {
        "ĐANG CHỜ XỬ LÝ": "Đang chờ",
        "ĐANG XỬ LÝ": "Đang xử lý",
        "ĐÃ GIẢI QUYẾT": "Đã giải quyết",
        "KHÔNG GIẢI QUYẾT ĐƯỢC": "Không thể giải quyết được",
        "ĐÃ HỦY": "Đã hủy",
      };
      const variant =
        status === "ĐANG CHỜ XỬ LÝ"
          ? "processing"
          : status === "ĐANG XỬ LÝ"
            ? "pending"
            : status === "ĐÃ GIẢI QUYẾT"
              ? "success"
              : "destructive";
      return (
        <Badge variant={variant}>
          {statusMap[status] || status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Ngày tạo",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return formatDateUTC(date);
    },
  },
  {
    accessorKey: "updated_at",
    header: "Cập nhật cuối",
    cell: ({ row }) => {
      const date = row.getValue("updated_at") as string;
      return formatDateUTC(date);
    },
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const report = row.original;
      const status = row.getValue("status") as string;
      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(report)}>
            <Eye className="h-4 w-4 mr-1" />
            Xem
          </Button>
          {status !== "ĐÃ GIẢI QUYẾT" &&
            status !== "ĐÃ HỦY" &&
            status !== "KHÔNG GIẢI QUYẾT ĐƯỢC" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate(report)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Cập nhật
              </Button>
            )}
          {(status === "ĐÃ GIẢI QUYẾT" ||
            status === "ĐÃ HỦY" ||
            status === "KHÔNG GIẢI QUYẾT ĐƯỢC") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate(report)}
                disabled
              >
                <Edit className="h-4 w-4 mr-1" />
                Cập nhật
              </Button>
            )}
        </div>
      );
    },
  },
];
