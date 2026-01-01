import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
interface StationHeaderProps {
  onAddStation: () => void;
}
export default function StationHeader({ onAddStation }: StationHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quản lý trạm xe</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý danh sách trạm xe đạp
        </p>
      </div>
      <Button onClick={onAddStation}>
        <Plus className="w-4 h-4 mr-2" /> Thêm trạm mới
      </Button>
    </div>
  );
}
