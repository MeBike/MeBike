"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStationActions } from "@/hooks/use-station";
import type { Station } from "@custom-types";

export default function StationDetailPage() {
  const router = useRouter();
  const params = useParams<{ stationId: string }>();
  const stationId = params?.stationId ?? "";

  const {
    getStationByID,
    responseStationDetail,
    isLoadingGetStationByID,
    getReservationStats,
    responseStationReservationStats,
  } = useStationActions({
    hasToken: true,
    stationId,
  });

  useEffect(() => {
    if (!stationId) return;
    getStationByID();
    getReservationStats();
  }, [stationId, getStationByID, getReservationStats]);

  const station = responseStationDetail as unknown as Station | undefined;

  if (!stationId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Chi tiết trạm</h1>
        <p className="text-muted-foreground">Không tìm thấy mã trạm.</p>
        <Button variant="outline" onClick={() => router.push("/admin/stations")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chi tiết trạm xe</h1>
          <p className="text-muted-foreground mt-1">
            Thông tin trạm và thống kê liên quan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/stations")}>
            Quay lại danh sách
          </Button>
        </div>
      </div>

      {isLoadingGetStationByID ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4" />
          <span className="text-lg text-foreground">Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Tên trạm
              </label>
              <p className="text-foreground font-medium">{station?.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Địa chỉ
              </label>
              <p className="text-foreground">{station?.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Latitude
                </label>
                <p className="text-foreground">{station?.latitude}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Longitude
                </label>
                <p className="text-foreground">{station?.longitude}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Sức chứa
              </label>
              <p className="text-foreground">{station?.capacity} xe</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Ngày tạo
                </label>
                <p className="text-foreground text-sm">
                  {new Date(station?.created_at || "").toLocaleDateString(
                    "vi-VN",
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Cập nhật lần cuối
                </label>
                <p className="text-foreground text-sm">
                  {new Date(station?.updated_at || "").toLocaleDateString(
                    "vi-VN",
                  )}
                </p>
              </div>
            </div>

            {responseStationReservationStats?.result && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  Thống kê đặt chỗ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Tổng đặt chỗ
                    </label>
                    <p className="text-foreground font-medium">
                      {responseStationReservationStats.result.total_count || "0"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Đang chờ xử lý
                    </label>
                    <p className="text-foreground font-medium">
                      {responseStationReservationStats.result.status_counts
                        .Pending || "0"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Đã hủy
                    </label>
                    <p className="text-foreground font-medium">
                      {responseStationReservationStats.result.status_counts
                        .Cancelled || "0"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Đã hết hạn
                    </label>
                    <p className="text-foreground font-medium">
                      {responseStationReservationStats.result.status_counts
                        .Expired || "0"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Xe đang đặt trước
                    </label>
                    <p className="text-foreground font-medium">
                      {responseStationReservationStats.result.reserving_bikes
                        .length || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(station?.average_rating !== undefined ||
              station?.total_ratings !== undefined) && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground">
                  Đánh giá trạm
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-6 h-6 ${
                          star <= (station?.average_rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-xl font-bold text-foreground ml-2">
                      {station?.total_ratings && station.total_ratings > 0
                        ? (station.average_rating || 0).toFixed(1)
                        : "0"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ({station?.total_ratings || 0} đánh giá)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

