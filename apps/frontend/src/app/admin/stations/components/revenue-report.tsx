"use client";

import { formatDateUTC } from "@/utils/formatDateTime";
import type { StationBikeRevenue, StationStatistic } from "@/types";
import { 
  Building2, 
  Banknote, 
  Bike, 
  Calculator, 
  MapPin, 
  TrendingUp, 
  Clock, 
  Timer 
} from "lucide-react";

interface RevenueReportProps {
  data: StationBikeRevenue;
}

// Hàm format tiền tệ
const formatCurrency = (value: number | undefined) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
};

export function RevenueReport({ data }: RevenueReportProps) {
  const result = data;

  if (!result || !result.summary) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Báo cáo Doanh thu Trạm
              </h2>
              <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatDateUTC(result.period.from)} <span className="text-border mx-1">—</span> {formatDateUTC(result.period.to)}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <SummaryCard
            title="Tổng Trạm"
            value={result.summary.totalStations}
            icon={Building2}
            color="blue"
          />
          <SummaryCard
            title="Tổng Doanh Thu"
            value={formatCurrency(result.summary.totalRevenue)}
            icon={Banknote}
            color="green"
            isGradient
          />
          <SummaryCard
            title="Tổng Lượt Thuê"
            value={result.summary.totalRentals}
            icon={Bike}
            color="purple"
          />
          <SummaryCard
            title="Trung Bình / Trạm"
            value={formatCurrency(Number(result.summary.avgRevenuePerStation))}
            icon={Calculator}
            color="orange"
          />
        </div>

        {/* List Details */}
        <div className="space-y-5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-4">
            <span className="h-5 w-1.5 bg-primary rounded-full" /> 
            Chi tiết theo từng trạm
          </h3>
          <div className="flex flex-col gap-4">
            {result.stations?.map((station: StationStatistic, idx: number) => (
              <StationDetailCard key={station.id} station={station} index={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange";
  isGradient?: boolean;
}

function SummaryCard({ title, value, icon: Icon, color, isGradient }: SummaryCardProps) {
  const colorStyles = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    green: "bg-green-500/10 text-green-600 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  };

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </p>
        <div className={`p-2 rounded-lg border ${colorStyles[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p
        className={`text-2xl font-extrabold tracking-tight ${
          isGradient
            ? "bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StationDetailCard({
  station,
  index,
}: {
  station: StationStatistic;
  index: number;
}) {
  const revenue = station.totalRevenue || station.stationTotalRevenue || 0;
  const rentals = station.totalRentals || station.stationTotalRentals || 0;

  return (
    <div
      className="group relative bg-card border border-border/50 rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Station Info */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold border border-border/50 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors">
            {index + 1}
          </div>
          <div>
            <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
              {station.name}
            </h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{station.address}</span>
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Revenue */}
          <div className="flex flex-col justify-center px-4 py-3 bg-green-500/5 border border-green-500/10 rounded-lg">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600/80 mb-1 flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Doanh thu
            </p>
            <p className="font-bold text-green-700 dark:text-green-500">
              {formatCurrency(revenue)}
            </p>
          </div>

          {/* Rentals */}
          <div className="flex flex-col justify-center px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/80 mb-1 flex items-center gap-1">
              <Bike className="w-3 h-3" /> Lượt thuê
            </p>
            <p className="font-bold text-blue-700 dark:text-blue-500">{rentals}</p>
          </div>

          {/* Total Duration */}
          <div className="flex flex-col justify-center px-4 py-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-600/80 mb-1 flex items-center gap-1">
              <Timer className="w-3 h-3" /> Tổng thời gian
            </p>
            <p className="font-bold text-purple-700 dark:text-purple-500">
              {station.totalDuration || "0"} <span className="text-xs font-normal opacity-70">phút</span>
            </p>
          </div>

          {/* Avg Duration */}
          <div className="flex flex-col justify-center px-4 py-3 bg-orange-500/5 border border-orange-500/10 rounded-lg">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-600/80 mb-1 flex items-center gap-1">
              <Calculator className="w-3 h-3" /> TB / Chuyến
            </p>
            <p className="font-bold text-orange-700 dark:text-orange-500">
              {station.avgDuration || "0"} <span className="text-xs font-normal opacity-70">phút</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}