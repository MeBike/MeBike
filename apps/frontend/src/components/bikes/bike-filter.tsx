import { Button } from "@/components/ui/button";
import { BikeStatus , BikeFiltersProps} from "@custom-types";
import { Select, SelectContent, SelectItem, SelectValue } from "@radix-ui/react-select";
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
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as BikeStatus | "all")}
        >
          <SelectValue placeholder="Chọn trạng thái" />
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="AVAILABLE">Có sẵn</SelectItem>
            <SelectItem value="RENTED">Đang được thuê</SelectItem>
            <SelectItem value="DAMAGED">Bị hỏng</SelectItem>
            <SelectItem value="BOOKED">Đã đặt trước</SelectItem>
            <SelectItem value="MAINTENANCE">Đang bảo trì</SelectItem>
            <SelectItem value="UNAVAILABLE">Không có sẵn</SelectItem>
          </SelectContent>
        </Select>
        
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