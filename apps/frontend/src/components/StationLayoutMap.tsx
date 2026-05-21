import React from "react";
import { 
  Bike, 
  SquareDashed, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  Hammer, 
  Truck,
  HelpCircle
} from "lucide-react";
import { Station } from "@/types";
import { cn } from "@/lib/utils";

interface StationLayoutMapProps {
  station: Station;
}

export const StationLayoutMap: React.FC<StationLayoutMapProps> = ({ station }) => {
  const totalSlots = station.capacity.total || 0;

  // 1. Cấu hình các loại Slot (Xe & Chỗ trống)
  const slotTypes = [
    {
      id: "bike-available",
      label: "Xe sẵn sàng",
      count: station.bikes.available || 0,
      icon: Bike,
      style: "bg-emerald-100 text-emerald-600 border border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-400 shadow-sm",
    },
    {
      id: "bike-reserved",
      label: "Xe đã đặt",
      count: station.bikes.reserved || 0,
      icon: Clock,
      style: "bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-400 shadow-sm",
    },
    {
      id: "bike-dispatch",
      label: "Xe chờ điều phối",
      count: station.bikes.pendingDispatch || 0,
      icon: Truck,
      style: "bg-orange-100 text-orange-600 border border-orange-200 dark:bg-orange-500/20 dark:border-orange-500/30 dark:text-orange-400 shadow-sm",
    },
    {
      id: "bike-broken",
      label: "Xe hỏng",
      count: station.bikes.broken || 0,
      icon: AlertTriangle,
      style: "bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-400 shadow-sm",
    },
    {
      id: "bike-fixed",
      label: "Xe đã sửa",
      count: station.bikes.fixed || 0,
      icon: Hammer,
      style: "bg-indigo-100 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-400 shadow-sm",
    },
    {
      id: "slot-return",
      label: "Chỗ khách trả xe",
      count: station.returnSlots.available || 0,
      icon: SquareDashed,
      style: "border-2 border-dashed border-blue-300 text-blue-500 bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-900/10 dark:border-blue-500/40",
    },
    {
      id: "slot-redistribution",
      label: "Chỗ nhận điều phối",
      count: station.redistributionSlots || 0,
      icon: SquareDashed,
      style: "border-2 border-dashed border-orange-300 text-orange-400 bg-orange-50/50 hover:bg-orange-100 dark:bg-orange-900/10 dark:border-orange-500/40",
    },
    {
      id: "slot-maintenance",
      label: "Khe đỗ bảo trì",
      count: station.maintenanceSlots || 0,
      icon: Wrench,
      style: "bg-slate-100 text-slate-500 border border-slate-200 opacity-70 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400",
    },
  ];

  // Lọc ra những trạng thái có số lượng > 0 để hiển thị trên chú thích (Legend)
  const activeLegends = slotTypes.filter((type) => type.count > 0);

  // 2. Tạo mảng đại diện cho toàn bộ bãi đỗ dựa trên số lượng thực tế
  let layoutGrid: typeof slotTypes[0][] = [];
  slotTypes.forEach((type) => {
    layoutGrid = [...layoutGrid, ...Array(type.count).fill(type)];
  });

  // Đảm bảo grid không vượt quá tổng sức chứa (hoặc bù thêm slot rỗng nếu dữ liệu bị thiếu hụt)
  if (layoutGrid.length < totalSlots) {
    const unknownSlot = {
      id: "slot-unknown",
      label: "Trống (Chưa xác định)",
      count: totalSlots - layoutGrid.length,
      icon: HelpCircle,
      style: "border-2 border-dotted border-gray-200 text-gray-400 bg-gray-50/20",
    };
    layoutGrid = [...layoutGrid, ...Array(unknownSlot.count).fill(unknownSlot)];
  } else if (layoutGrid.length > totalSlots) {
    // Nếu data backend trả về tổng các loại lớn hơn totalCapacity (do logic), ta cắt bớt cho chuẩn UI
    layoutGrid = layoutGrid.slice(0, totalSlots);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">
          Sơ đồ bãi đỗ 2D <span className="text-muted-foreground font-normal text-sm ml-1">({totalSlots} vị trí)</span>
        </h2>
      </div>

      <div className="flex-1 p-6">
        {/* CHÚ THÍCH (LEGEND) */}
        <div className="mb-6 flex flex-wrap gap-x-5 gap-y-3 rounded-xl border border-border/40 bg-muted/10 p-4">
          {activeLegends.map((legend) => {
            const Icon = legend.icon;
            return (
              <div key={legend.id} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", legend.style)}>
                  <Icon size={12} />
                </div>
                <span>
                  {legend.label} <strong className="text-foreground">({legend.count})</strong>
                </span>
              </div>
            );
          })}
        </div>

        {/* LƯỚI 2D */}
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
          {layoutGrid.map((slot, index) => {
            const Icon = slot.icon;
            const slotNumber = index + 1;
            
            return (
              <div
                key={`${slot.id}-${index}`}
                className={cn(
                  "group relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg transition-all hover:scale-105",
                  slot.style
                )}
                title={`Vị trí ${slotNumber}: ${slot.label}`}
              >
                <Icon size={22} className="mb-1 transition-transform group-hover:-translate-y-0.5" />
                <span className="text-[10px] font-bold opacity-80">{slotNumber}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};