import { Badge } from "@/components/ui/badge";
import type { Supplier } from "@/types";

const statusConfig: Record<string, { label: string; variant: string }> = {
  ACTIVE: {
    label: "Hoạt động",
    variant : "success",
  },
  INACTIVE: {
    label: "Ngưng hoạt động",
    variant : "pending"
  },
  TERMINATED: {
    label: "Đã chấm dứt",
    variant: "danger",
  },
  "": {
    label: "Chưa xác định",
    variant: "bg-muted text-muted-foreground border-border",
  },
};

export function SupplierStatusBadge({ status }: { status: Supplier["status"] }) {
  const config = statusConfig[status] || statusConfig[""];
  return (
    <Badge variant={config.variant as "success" | "danger" | "pending"}>
      {config.label}
    </Badge>
  );
}
