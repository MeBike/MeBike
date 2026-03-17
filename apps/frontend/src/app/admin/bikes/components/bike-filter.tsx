import { Button } from "@/components/ui/button";
import { BikeStatus } from "@custom-types";
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
          <option value="all">ALL</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="BOOKED">BOOKED</option>
          <option value="BROKEN">BROKEN</option>
          <option value="RESERVED">RESERVED</option>
          <option value="MAINTAINED">MAINTAINED</option>
          <option value="UNAVAILABLE">UNAVAILABLE</option>
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