"use client";

import { formatDateUTC } from "@/utils/formatDateTime";

// 1. DEFINE LẠI TYPE CHO CHUẨN VỚI RESPONSE API
export interface StationStatistic {
  id: string; // API trả về "id" chứ không phải "_id"
  name: string;
  address: string;
  totalRevenue?: number; // Back-end thường trả về số
  stationTotalRevenue?: number; 
  totalRentals?: number;
  stationTotalRentals?: number;
  totalDurationFormatted?: string; // Nếu không có, mình sẽ fallback "--"
}

export interface StationBikeRevenue {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalStations: number;
    totalRevenue: number;
    totalRentals: number;
    avgRevenuePerStation: number;
  };
  stations: StationStatistic[];
}

interface RevenueReportProps {
  data: StationBikeRevenue;
}

// 2. HÀM DÙNG CHUNG ĐỂ FORMAT TIỀN VNĐ
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
      <div className="bg-gradient-to-br from-card via-card to-muted/20 border border-border rounded-2xl p-8 shadow-lg">
        
        {/* Header Doanh Thu */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Báo cáo Doanh thu Trạm Xe</h2>
              <p className="text-sm text-muted-foreground italic">
                {formatDateUTC(result.period.from)} → {formatDateUTC(result.period.to)}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard 
            title="Trạm" 
            value={result.summary.totalStations} 
            color="blue" 
          />
          <SummaryCard 
            title="Doanh Thu" 
            value={formatCurrency(result.summary.totalRevenue)} 
            color="green" 
            isGradient 
          />
          <SummaryCard 
            title="Lượt Thuê" 
            value={result.summary.totalRentals} 
            color="purple" 
          />
          <SummaryCard 
            title="Trung Bình" 
            value={formatCurrency(result.summary.avgRevenuePerStation)} 
            color="orange" 
          />
        </div>

        {/* List Details */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="h-1 w-8 bg-primary rounded-full" /> Chi tiết theo trạm
          </h3>
          {result.stations?.map((station: StationStatistic, idx: number) => (
            <StationDetailCard key={station.id} station={station} index={idx} />
          ))}
        </div> 
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

interface SummaryCardProps {
  title: string;
  value: string | number;
  color: "blue" | "green" | "purple" | "orange";
  isGradient?: boolean;
}

function SummaryCard({ title, value, color, isGradient }: SummaryCardProps) {
  const colors = {
    blue: "from-blue-500/10 border-blue-500/20 text-blue-600",
    green: "from-green-500/10 border-green-500/20 text-green-600",
    purple: "from-purple-500/10 border-purple-500/20 text-purple-600",
    orange: "from-orange-500/10 border-orange-500/20 text-orange-600",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-6 hover:scale-[1.02] transition-transform shadow-sm`}>
      <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${isGradient ? "bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function StationDetailCard({ station, index }: { station: StationStatistic, index: number }) {
  // Lấy giá trị tổng doanh thu & lượt thuê (Phòng trường hợp backend đổi key)
  const revenue = station.totalRevenue || station.stationTotalRevenue || 0;
  const rentals = station.totalRentals || station.stationTotalRentals || 0;

  return (
    <div 
      className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all shadow-sm" 
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
            {index + 1}
          </div>
          <div>
            <h4 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {station.name}
            </h4>
            <p className="text-sm text-muted-foreground">{station.address}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
            <p className="text-[10px] uppercase text-muted-foreground">Doanh thu</p>
            <p className="font-bold text-green-600">{formatCurrency(revenue)}</p>
          </div>
          <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
            <p className="text-[10px] uppercase text-muted-foreground">Lượt thuê</p>
            <p className="font-bold text-blue-600">{rentals}</p>
          </div>
          <div className="text-center px-4 py-2 bg-muted/50 rounded-lg col-span-2 lg:col-span-1">
            <p className="text-[10px] uppercase text-muted-foreground">Tổng giờ</p>
            <p className="font-bold text-purple-600">
              {station.totalDurationFormatted || "--"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}