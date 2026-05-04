"use client";

import { CouponStat } from "@/types/Coupon";
import { ruleStatsColumns } from "@/columns/stats-by-rule-column";
import { DataTable } from "@/components/TableCustom";
import { 
  Ticket, 
  Banknote, 
  Percent, 
  Calculator, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Calendar 
} from "lucide-react";
import { formatDateUTC } from "@/utils/formatDateTime"; // Đảm bảo bạn có hàm này giống bên Revenue

export const CouponStatsView = ({ data }: { data: CouponStat | undefined }) => {
  if (!data) return <div className="p-8 text-center text-muted-foreground border rounded-xl border-dashed">Không có dữ liệu thống kê.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Date Range */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Tổng quan Khuyến mãi</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground border border-border/50">
          <Calendar className="w-4 h-4 text-primary" />
          <span>
            {data.range.from ? formatDateUTC(data.range.from) : "Tất cả"} 
            <span className="mx-2">—</span> 
            {data.range.to ? formatDateUTC(data.range.to) : "Hiện tại"}
          </span>
        </div>
      </div>

      {/* Metrics Grid - Tăng lên 3 cột để chứa 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title="Tổng lượt thuê" 
          value={data.summary.totalCompletedRentals} 
          icon={Ticket}
          color="blue"
        />
        <StatCard 
          title="Lượt có áp mã" 
          value={data.summary.discountedRentalsCount} 
          icon={CheckCircle2}
          color="green"
        />
        <StatCard 
          title="Lượt không áp mã" 
          value={data.summary.nonDiscountedRentalsCount} 
          icon={XCircle}
          color="slate"
        />
        <StatCard 
          title="Tổng tiền giảm" 
          value={`${data.summary.totalDiscountAmount.toLocaleString("vi-VN")}đ`} 
          icon={Banknote}
          color="purple"
        />
        <StatCard 
          title="Tỷ lệ giảm" 
          value={`${data.summary.discountRate}%`} 
          icon={Percent}
          color="orange"
        />
        <StatCard 
          title="TB giảm / lượt" 
          value={`${data.summary.avgDiscountAmount.toLocaleString("vi-VN")}đ`} 
          icon={Calculator}
          color="blue"
        />
      </div>

      {/* Top Rule Banner */}
      {data.topAppliedRule && (
        <div className="relative overflow-hidden p-6 md:p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg border border-blue-500/30">
          <Trophy className="absolute -right-6 -top-6 w-40 h-40 text-white opacity-10 pointer-events-none transform -rotate-12" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md shadow-inner border border-white/20">
              <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 drop-shadow-md" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-semibold text-blue-200 uppercase tracking-widest mb-1">
                Quy tắc hiệu quả nhất
              </p>
              <h4 className="text-xl md:text-2xl font-extrabold tracking-tight drop-shadow-sm">
                {data.topAppliedRule.name}
              </h4>
              <p className="text-sm font-medium mt-2 bg-black/20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                Đã áp dụng: <span className="font-bold text-yellow-400">{data.topAppliedRule.appliedCount}</span> lượt
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chi tiết theo quy tắc */}
      {data.statsByRule && data.statsByRule.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <span className="h-5 w-1.5 bg-primary rounded-full" /> 
            Chi tiết theo Quy tắc
          </h3>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Sử dụng component DataTable của bạn để hiển thị mảng statsByRule */}
            <DataTable 
              columns={ruleStatsColumns} 
              data={data.statsByRule} 
            />
          </div>
        </div>
      )}
      
      {/* Phân bổ mức giảm giá (Nếu có data) */}
      {data.statsByDiscountAmount && data.statsByDiscountAmount.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <span className="h-5 w-1.5 bg-orange-500 rounded-full" /> 
            Phân bổ mức giảm giá
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.statsByDiscountAmount.map((stat: any, index: number) => (
              <div key={index} className="bg-muted/30 p-4 rounded-xl border border-border text-center">
                <p className="text-xs text-muted-foreground uppercase mb-1">{stat.range || "Mức giá"}</p>
                <p className="text-lg font-bold text-foreground">{stat.count || 0} lượt</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

// --- SUB COMPONENTS ---

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange" | "slate";
}

const StatCard = ({ title, value, icon: Icon, color }: StatCardProps) => {
  const colorStyles = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    green: "bg-green-500/10 text-green-600 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    slate: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </p>
        <div className={`p-2 rounded-lg border ${colorStyles[color]} transition-colors`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground truncate">
        {value}
      </p>
    </div>
  );
};