import { BikeStatus , BikeStatistics } from "@custom-types";

export function BikeStats({ stats }: { stats: BikeStatistics }) {
  const data = [
    { label: "Tổng số", value: stats.AVAILABLE + stats.RENTED + stats.RESERVED + stats.BROKEN + stats.PENDING_DISPATCH + stats.TRANSPORTING + stats.SWAPPING + stats.LOST + stats.DISABLED, color: "" },
    { label: "Có sẵn", value: stats.AVAILABLE, color: "text-green-800" },
    { label: "Đang thuê", value: stats.RENTED, color: "text-yellow-800" },
    { label: "Đặt trước", value: stats.RESERVED, color: "text-orange-800" },
    { label: "Đã sửa", value: stats.FIXED, color: "text-slate-800" },
    { label: "Chuẩn bị điều phối", value: stats.PENDING_DISPATCH, color: "text-purple-800" },
    { label: "Đang vận chuyển", value: stats.TRANSPORTING, color: "text-teal-800" },
    { label: "Hỗ trợ sự cố", value: stats.SWAPPING, color: "text-fuchsia-800" },
    { label: "Đã mất", value: stats.LOST, color: "text-rose-800" },
    { label: "Đang hỏng", value: stats.BROKEN, color: "text-red-800" },
    { label: "Tạm ngưng hoạt động", value: stats.DISABLED, color: "text-slate-800" },
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