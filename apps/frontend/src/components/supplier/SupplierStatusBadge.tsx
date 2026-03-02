import { Badge } from "@/components/ui/badge";
import type { Supplier } from "@/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Hoạt động",
    className: "bg-success/15 text-success border-success/30 hover:bg-success/20",
  },
  INACTIVE: {
    label: "Ngưng hoạt động",
    className: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/20",
  },
  TERMINATED: {
    label: "Đã chấm dứt",
    className: "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20",
  },
  "": {
    label: "Chưa xác định",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function SupplierStatusBadge({ status }: { status: Supplier["status"] }) {
  const config = statusConfig[status] || statusConfig[""];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
