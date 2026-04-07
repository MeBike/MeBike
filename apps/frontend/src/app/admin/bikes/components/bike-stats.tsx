import { BikeStatus , BikeStatistics } from "@custom-types";

export function BikeStats({ stats }: { stats: BikeStatistics }) {
  const data = [
    { label: "Tổng số", value: stats.AVAILABLE + stats.BOOKED + stats.RESERVED + stats.BROKEN + stats.UNAVAILABLE, color: "" },
    { label: "Có sẵn", value: stats.AVAILABLE, color: "text-green-500" },
    { label: "Đang thuê", value: stats.BOOKED, color: "text-blue-500" },
    { label: "Đặt trước", value: stats.RESERVED, color: "text-yellow-500" },
    { label: "Bị hỏng", value: stats.BROKEN, color: "text-red-500" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.map((s) => (
        <div key={s.label} className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{s.label}</p>
          <p className={`text-2xl font-bold ${s.color}`}>{s.value || 0}</p>
        </div>
      ))}
    </div>
  );
}