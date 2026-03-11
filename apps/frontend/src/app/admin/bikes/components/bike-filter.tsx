import { Button } from "@/components/ui/button";
import { BikeStatus } from "@custom-types";
import { Select } from "@radix-ui/react-select";

interface BikeFiltersProps {
  statusFilter: BikeStatus | "all";
  setStatusFilter: (status: BikeStatus | "all") => void;
  onReset?: () => void;
}

export function BikeFilters({ 
  statusFilter, 
  setStatusFilter, 
  onReset 
}: BikeFiltersProps) {
  
  const handleReset = () => {
    setStatusFilter("all");
    if (onReset) onReset();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BikeStatus | "all")}
          className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="AVAILABLE">Có sẵn</option>
          <option value="RENTED">Đang được thuê</option>
          <option value="BROKEN">Bị hỏng</option>
          <option value="RESERVED">Đã đặt trước</option>
          <option value="MAINTAINED">Đang bảo trì</option>
          <option value="UNAVAILABLE">Không có sẵn</option>
        </select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
        >
          Đặt lại
        </Button>
      </div>
    </div>
  );
}