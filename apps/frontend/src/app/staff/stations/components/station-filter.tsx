import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
interface StationFilterProps {
  value: string;
  onChange: (value: string) => void;
}
export default function StationFilter({ value, onChange }: StationFilterProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 items-center gap-4">
      <div className="flex justify-between">
        <div className="flex-1 mr-4">
          <Input
            type="text"
            placeholder="Tìm kiếm trạm..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 border border-border rounded-md"
          />
        </div>
        <div>
          <Button variant="outline" onClick={() => onChange("")}>
            Đặt lại
          </Button>
        </div>
      </div>
    </div>
  );
}
