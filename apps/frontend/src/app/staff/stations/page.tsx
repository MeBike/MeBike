"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, ChevronUp, Loader2, Bell } from "lucide-react";
import { useStationActions } from "@/hooks/use-station";
import { useDistributionRequest } from "@/hooks/use-distribution-request";
import { StationTableSection } from "./components/station-table-section";
import { TableSkeleton } from "@/components/table-skeleton";
import { useDebounce } from "@/utils/useDebounce";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSystemConfigActions } from "@/hooks/use-system-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import thêm Select để làm filter
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Định nghĩa cấu hình màu sắc tương ứng với demandLevel
const DEMAND_CONFIG = {
  low: {
    color: "#22c55e",
    text: "Thấp",
    badgeBg: "bg-green-500/10 text-green-600 border-green-200",
  },
  medium: {
    color: "#f59e0b",
    text: "Trung bình",
    badgeBg: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
  high: {
    color: "#ef4444",
    text: "Cao",
    badgeBg: "bg-red-500/10 text-red-600 border-red-200",
  },
};

export default function StationsPage() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState("");
  const currentHour = new Date().getHours();
  const defaultStart = currentHour === 23 ? 5 : currentHour;

  const [startHour, setStartHour] = useState<number>(defaultStart);
  const [endHour, setEndHour] = useState<number>(23);
  const debounceSearchQuery = useDebounce(searchQuery, 500);
  const { systemConfigs, getAllSystemConfigs } = useSystemConfigActions({
    hasToken: true,
  });
  const {
    getMyStation,
    myStation,
    paginationMyStation,
    isLoadingMyStation,
    listStation,
    getListStation,
  } = useStationActions({
    hasToken: true,
    page: page,
    limit: limit,
    name: debounceSearchQuery,
  });

  useEffect(() => {
    getAllSystemConfigs();
  }, [getAllSystemConfigs]);

  // Gọi API lấy dữ liệu dự báo theo State giờ đã chọn
  const {
    reservationForecast,
    isLoadingReservationForecast,
    getReservationForecast,
  } = useDistributionRequest({
    hasToken: true,
    startHour: startHour,
    endHour: endHour,
  });
  useEffect(() => {
    if (getReservationForecast) {
      getReservationForecast();
    }
  }, [startHour, endHour, getReservationForecast]);
  // --- 1. TẠO THÊM LIST GIỜ ĐỂ ĐỔ VÀO DROPDOWN SELECT ---
  const hoursOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: `${i.toString().padStart(2, "0")}:00`,
    }));
  }, []);

  // --- 3. CẬP NHẬT LẠI FAKE DATA (THÊM +0.5 ĐỂ NẰM GIỮA KHE GIỜ) ---
  const fakeChartData = useMemo(() => {
    return [
      {
        hourValue: 6.5,
        time: "06:00",
        reservedCount: 3,
        demandLevel: "low" as const,
      },
      {
        hourValue: 7.5,
        time: "07:00",
        reservedCount: 15,
        demandLevel: "medium" as const,
      },
      {
        hourValue: 8.5,
        time: "08:00",
        reservedCount: 28,
        demandLevel: "high" as const,
      },
      {
        hourValue: 9.5,
        time: "09:00",
        reservedCount: 12,
        demandLevel: "medium" as const,
      },
      {
        hourValue: 10.5,
        time: "10:00",
        reservedCount: 5,
        demandLevel: "low" as const,
      },
      {
        hourValue: 11.5,
        time: "11:00",
        reservedCount: 2,
        demandLevel: "low" as const,
      },
      {
        hourValue: 12.5,
        time: "12:00",
        reservedCount: 8,
        demandLevel: "medium" as const,
      },
    ];
  }, []);

  // Tạo danh sách vạch chia trục X chạy động theo startHour và endHour của bộ lọc
  const xAxisTicks = useMemo(() => {
    const ticks = [];
    for (let i = startHour; i <= endHour; i++) {
      ticks.push(i);
    }
    return ticks;
  }, [startHour, endHour]);

  const [isVisualLoading, setIsVisualLoading] = useState(false);
  const [hasNotified, setHasNotified] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const currentStationId = listStation?.currentStation?.id;
  const currentStationName = listStation?.currentStation?.name;

  const currentStationDetails = useMemo(() => {
    return myStation?.find((s: any) => s.id === currentStationId);
  }, [myStation, currentStationId]);

  const minAvailableBikeAtStation = Number(
    systemConfigs?.find(
      (item) => item.key === "min_bikes_for_redistribution_alert",
    )?.value || 0,
  );

  const availableBikes = currentStationDetails?.bikes?.available ?? 11;
  const isLowBikes = availableBikes < minAvailableBikeAtStation;

  useEffect(() => {
    if (!currentStationId) return;
    const lastSentStr = localStorage.getItem(
      `low_bike_notif_sent_${currentStationId}`,
    );
    if (lastSentStr) {
      const lastSent = parseInt(lastSentStr, 10);
      const now = Date.now();
      const COOLDOWN_TIME = 5 * 60 * 1000;
      if (now - lastSent < COOLDOWN_TIME) {
        setHasNotified(true);
        const remaining = COOLDOWN_TIME - (now - lastSent);
        const timer = setTimeout(() => {
          setHasNotified(false);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setHasNotified(false);
      }
    } else {
      setHasNotified(false);
    }
  }, [currentStationId]);

  const handleSendNotification = async () => {
    if (!currentStationId || !currentStationName) return;
    if (!isLowBikes || isSendingNotification || hasNotified) return;

    setIsSendingNotification(true);
    try {
      const response = await axios.post("/api/notifications/low-bike", {
        stationId: currentStationId,
        stationName: currentStationName,
        availableBikes: availableBikes,
      });
      if (response.data.success) {
        setHasNotified(true);
        localStorage.setItem(
          `low_bike_notif_sent_${currentStationId}`,
          Date.now().toString(),
        );
        toast.success(
          `Đã gửi thông báo thiếu xe! Trạm hiện chỉ còn ${availableBikes} xe.`,
        );
      } else {
        toast.error("Báo cáo thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi gửi push notification:", error);
      toast.error("Có lỗi xảy ra khi gửi báo cáo.");
    } finally {
      setIsSendingNotification(false);
    }
  };

  useEffect(() => {
    if (isLoadingMyStation) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMyStation]);

  useEffect(() => {
    getMyStation();
  }, [page, getMyStation, limit]);

  useEffect(() => {
    getListStation();
  }, [getListStation]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // --- MAP DATA THẬT TỪ NEW API MODEL (THÊM LẠI +0.5 ĐỂ CĂN GIỮA) ---
  const chartData = useMemo(() => {
    const rawData = reservationForecast;
    if (!rawData || !rawData.hours || !Array.isArray(rawData.hours)) {
      return [];
    }
    return rawData.hours.map((hourItem: any) => {
      const currentHour = parseInt(String(hourItem.label).split(":")[0], 10);
      return {
        time: hourItem.label,
        hourValue: currentHour + 0.5, // Logic +0.5 thần thánh giúp chấm nằm giữa khe giờ
        reservedCount: hourItem.reservedCount || 0,
        demandLevel: hourItem.demandLevel || "low",
      };
    });
  }, [reservationForecast]);

  const activeChartData = chartData.length > 0 ? chartData : fakeChartData;

  if (isVisualLoading) {
    return <LoadingScreen />;
  }

  return (
    <div>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              Quản lý trạm xe
            </h1>
            <p className="text-muted-foreground text-lg">
              Hệ thống giám sát và vận hành trạm xe đạp thông minh.
            </p>

            {listStation?.currentStation && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary shadow-sm">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></span>
                  <span>
                    Đang làm việc tại:{" "}
                    <strong>{listStation.currentStation.name}</strong>
                  </span>
                </div>

                {currentStationDetails && (
                  <Button
                    onClick={handleSendNotification}
                    disabled={
                      !isLowBikes || isSendingNotification || hasNotified
                    }
                    className={cn(
                      "shadow-sm transition-all duration-200 active:scale-95 rounded-full h-8 px-4 text-xs font-semibold",
                      isLowBikes && !hasNotified
                        ? "bg-rose-600 hover:bg-rose-700 text-white hover:scale-105 shadow-rose-200 dark:shadow-none"
                        : "bg-muted/50 border border-border text-muted-foreground/60 cursor-not-allowed",
                    )}
                  >
                    <Bell
                      className={cn(
                        "w-3.5 h-3.5 mr-1.5",
                        isLowBikes && !hasNotified && "animate-bounce",
                      )}
                    />
                    {isSendingNotification
                      ? "Đang gửi..."
                      : hasNotified
                        ? "Đã thông báo"
                        : `Báo thiếu xe (${availableBikes})`}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BIỂU ĐỒ HOÀN CHỈNH KÈM BỘ FILTER */}
        {listStation?.currentStation && (
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Dự báo số lượng đặt xe tại trạm:{" "}
                {listStation.currentStation.name}
                {isLoadingReservationForecast && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>

              {/* THANH BỘ LỌC THỜI GIAN KHUNG GIỜ */}
              <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/40 self-start sm:self-auto">
                <span className="text-xs font-bold text-muted-foreground px-2">
                  Khung giờ:
                </span>

                {/* Chọn Start Hour */}
                <Select
                  value={String(startHour)}
                  onValueChange={(val) => {
                    const num = Number(val);
                    setStartHour(num);
                    // Tự động đẩy endHour nếu start >= end, nhưng chốt chặn thấp nhất luôn là 6h
                    if (num >= endHour) {
                      setEndHour(Math.max(Math.min(num + 1, 23), 6));
                    }
                  }}
                >
                  <SelectTrigger className="w-[100px] h-8 text-xs bg-background rounded-lg shadow-sm">
                    <SelectValue placeholder="Từ" />
                  </SelectTrigger>
                  <SelectContent>
                    {hoursOptions.map((h) => (
                      <SelectItem
                        key={`start-${h.value}`}
                        value={String(h.value)}
                        disabled={h.value > endHour}
                      >
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-muted-foreground text-xs">➔</span>

                {/* Chọn End Hour */}
                <Select
                  value={String(endHour)}
                  onValueChange={(val) => setEndHour(Number(val))}
                >
                  <SelectTrigger className="w-[100px] h-8 text-xs bg-background rounded-lg shadow-sm">
                    <SelectValue placeholder="Đến" />
                  </SelectTrigger>
                  <SelectContent>
                    {hoursOptions.map((h) => (
                      <SelectItem
                        key={`end-${h.value}`}
                        value={String(h.value)}
                        // KHÓA THÊM: Nếu giờ nhỏ hơn startHour HOẶC nhỏ hơn 6h thì không cho chọn
                        disabled={h.value < startHour || h.value < 6}
                      >
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {activeChartData.length > 0 ? (
                <div className="h-[270px] w-full rounded-xl border border-border/50 bg-muted/5 p-4 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={activeChartData}
                      margin={{ top: 20, right: 40, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />

                      <XAxis
                        type="number"
                        dataKey="hourValue"
                        domain={[
                          xAxisTicks[0],
                          xAxisTicks[xAxisTicks.length - 1],
                        ]} // Chạy động theo mảng ticks mới chọn
                        ticks={xAxisTicks}
                        tickFormatter={(value) =>
                          `${value.toString().padStart(2, "0")}:00`
                        }
                        axisLine={{ stroke: "#94a3b8", strokeWidth: 2 }}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        dy={10}
                        label={{
                          value: "Thời gian (Giờ) ➔",
                          position: "insideBottomRight",
                          offset: -15,
                          fill: "#475569",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      />

                      <YAxis
                        axisLine={{ stroke: "#94a3b8", strokeWidth: 2 }}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        dx={-10}
                        allowDecimals={false}
                        label={{
                          value: "Số lượng xe (Chiếc)",
                          angle: -90,
                          position: "insideLeft",
                          offset: 0,
                          textAnchor: "middle",
                          fill: "#475569",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      />

                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const startHourValue = Math.floor(
                              Number(data.hourValue),
                            );
                            const formatStr = (h: number) =>
                              h.toString().padStart(2, "0");
                            const config =
                              DEMAND_CONFIG[
                                data.demandLevel as keyof typeof DEMAND_CONFIG
                              ] || DEMAND_CONFIG.low;

                            return (
                              <div className="rounded-xl border border-border bg-popover p-3 shadow-md space-y-1.5 text-sm">
                                <p className="font-bold text-foreground">
                                  Khung giờ: {formatStr(startHourValue)}:00 -{" "}
                                  {formatStr(startHourValue)}:59
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    Số xe đặt trước:
                                  </span>
                                  <span className="font-bold text-amber-500">
                                    {data.reservedCount} chiếc
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 pt-0.5 border-t border-border/60">
                                  <span className="text-muted-foreground text-xs">
                                    Mức độ nhu cầu:
                                  </span>
                                  <span
                                    className={cn(
                                      "text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-sm",
                                      config.badgeBg,
                                    )}
                                  >
                                    {config.text}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />

                      <Legend wrapperStyle={{ paddingTop: "20px" }} />

                      <Line
                        type="monotone"
                        dataKey="reservedCount"
                        name="Số xe đặt trước"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          const config =
                            DEMAND_CONFIG[
                              payload.demandLevel as keyof typeof DEMAND_CONFIG
                            ] || DEMAND_CONFIG.low;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={5}
                              fill={config.color}
                              stroke="#ffffff"
                              strokeWidth={1.5}
                              className="shadow-sm"
                            />
                          );
                        }}
                        activeDot={(props: any) => {
                          const { cx, cy, payload } = props;
                          const config =
                            DEMAND_CONFIG[
                              payload.demandLevel as keyof typeof DEMAND_CONFIG
                            ] || DEMAND_CONFIG.low;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={7}
                              fill={config.color}
                              stroke="#ffffff"
                              strokeWidth={2}
                              className="drop-shadow-md"
                            />
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center rounded-xl border border-dashed border-border mt-2 bg-muted/10">
                  <span className="text-muted-foreground text-sm font-medium">
                    {isLoadingReservationForecast
                      ? "Đang tải dữ liệu dự báo..."
                      : "Chưa có dữ liệu dự báo cho thời gian này"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* DANH SÁCH TRẠM */}
        <div className="space-y-4 min-h-[400px]">
          <h2 className="text-2xl font-bold px-1">Danh sách vận hành</h2>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc địa chỉ trạm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Đặt lại
            </Button>
          </div>
          {isVisualLoading ? (
            <TableSkeleton />
          ) : (
            <StationTableSection
              stations={myStation}
              pagination={paginationMyStation}
              setPage={setPage}
              isLoading={isLoadingMyStation}
              onView={(id) => {
                router.push(`/staff/stations/detail/${id}`);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
