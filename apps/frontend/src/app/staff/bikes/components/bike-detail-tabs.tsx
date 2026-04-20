"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getStatusColor, formatDateUTC } from "@utils";
import type {
  Bike,
  BikeRentalHistory,
  BikeActivityStats,
  BikeStats,
} from "@custom-types";

interface Props {
  bike: Bike | null;
  rentals: BikeRentalHistory[];
  activity: BikeActivityStats | null;
  stats: BikeStats | null;
}
export function BikeDetailTabs({ bike, rentals, activity, stats }: Props) {
  const [tab, setTab] = useState<string>("info");
  if (!bike)
    return (
      <div className="space-y-6">
        <div>
          <p className="text-center text-muted-foreground py-10">
            Không tìm thấy thông tin xe đạp
          </p>
        </div>
      </div>
    );

  const tabs = [
    { id: "info", label: "Thông tin" },
    { id: "rentals", label: "Lịch sử thuê" },
    { id: "stats", label: "Thống kê" },
    { id: "activity", label: "Hoạt động" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ID Xe</p>
              <p className="font-medium">{bike.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bike.status)}`}
              >
                {bike.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ngày tạo</p>
              <p className="font-medium">{formatDateUTC(bike.createdAt)}</p>
            </div>
          </div>
        )}

        {tab === "rentals" && (
          <div className="space-y-3">
            {rentals?.length > 0 ? (
              rentals.map((rental, index) => (
                <div
                  key={rental.id}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {rental.user.fullname || "Người dùng ẩn danh"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rental.startStation.name} → {rental.endStation.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                      {rental.totalPrice.toLocaleString()} VND
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(rental.duration / 60)} phút
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10">
                Không có lịch sử thuê
              </p>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-xs text-blue-600 font-bold uppercase">
                Phút hoạt động
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {activity?.totalMinutesActive || 0}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-xs text-green-600 font-bold uppercase">
                Tỷ lệ hoạt động
              </p>
              <p className="text-2xl font-bold text-green-800">
                {activity?.uptimePercentage || 0}%
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-xs text-red-600 font-bold uppercase">
                Số báo cáo hỏng
              </p>
              <p className="text-2xl font-bold text-red-800">
                {activity?.totalReports || 0}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-xs text-yellow-600 font-bold uppercase">
                Đánh giá TB
              </p>
              <p className="text-2xl font-bold text-yellow-800">
                {bike.averageRating?.toFixed(1) || "N/A"} ⭐
              </p>
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="flex justify-between border-b py-2">
              <span className="text-sm">Tổng thời gian hoạt động</span>
              <span className="font-medium">
                {stats?.totalDurationMinutes || 0} phút
              </span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-sm">Tổng lượt thuê</span>
              <span className="font-medium">{stats?.totalRentals || 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm">Tổng doanh thu</span>
              <span className="font-medium text-green-600">
                {stats?.totalRevenue?.toLocaleString() || 0} VND
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
