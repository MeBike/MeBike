import { Button } from "@/components/ui/button";
import { BikeStatus } from "@/types"; // Đảm bảo đúng path tới types của bạn

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
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Bộ lọc</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleReset}
          className="h-8 px-2 lg:px-3"
        >
          Xóa bộ lọc
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Trạng thái xe</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BikeStatus | "all")}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="AVAILABLE">Sẵn sàng</option>
            <option value="BOOKED">Đã đặt (Booked)</option>
            <option value="RESERVED">Đã giữ chỗ (Reserved)</option>
            <option value="MAINTENANCE">Đang bảo trì</option>
            <option value="BROKEN">Đang hỏng</option>
          </select>
        </div>

        {/* Bạn có thể thêm các bộ lọc khác ở đây (ví dụ: Trạm, Nhà cung cấp) */}
      </div>
    </div>
  );
}