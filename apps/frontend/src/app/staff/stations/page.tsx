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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getHours } from "date-fns";

export default function StationsPage() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(7);
  const [searchQuery, setSearchQuery] = useState("");
  const debounceSearchQuery = useDebounce(searchQuery, 500);
  const { systemConfigs, getAllSystemConfigs, isLoading } =
    useSystemConfigActions({ hasToken: true });
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
  // Tính toán giờ bắt đầu và kết thúc cho Chart
  const timeParams = useMemo(() => {
    return {
      startHour: new Date().getHours(),
      endHour: 23,
    };
  }, []);
  const { reservationForecast, isLoadingReservationForecast } =
    useDistributionRequest({
      hasToken: true,
      startHour: Number(timeParams.startHour),
      endHour: Number(timeParams.endHour),
    });

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
  const isLowBikes = availableBikes <= minAvailableBikeAtStation;
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
  // ----------------------------------------------

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

  // Data cho Chart
  const chartData = useMemo(() => {
    const rawData = reservationForecast;
    if (!rawData || !rawData.hours || !Array.isArray(rawData.hours)) {
      return [];
    }
    return rawData.hours.map((hourItem: any) => ({
      time: hourItem.label,
      reservedCount: hourItem.reservedCount || 0,
    }));
  }, [reservationForecast]);

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

            {/* BADGE TRẠM HIỆN TẠI & NÚT BÁO THIẾU XE */}
            {listStation?.currentStation && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary shadow-sm">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></span>
                  <span>
                    Đang làm việc tại:{" "}
                    <strong>{listStation.currentStation.name}</strong>
                  </span>
                </div>

                {/* HIỂN THỊ NÚT NẾU TÌM THẤY SỐ LƯỢNG XE */}
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

        {/* BIỂU ĐỒ */}
        {listStation?.currentStation && (
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Dự báo số lượng đặt xe tại trạm:{" "}
                {listStation.currentStation.name}
                {isLoadingReservationForecast && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-[250px] w-full rounded-xl border border-border/50 bg-muted/5 p-4 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="time"
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
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                        labelStyle={{ fontWeight: "bold", color: "#0f172a" }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      <Line
                        type="monotone"
                        dataKey="reservedCount"
                        name="Số xe đặt trước"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
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
