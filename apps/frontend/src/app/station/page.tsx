"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Station } from "@custom-types";
import Image from "next/image";
import { Footer } from "@/components/landing/landing-footer";
import { CTA } from "@/components/landing/cta";
import Header from "@/components/ui/layout/Header";
import { dashboardService } from "@/services/dashboard.service";

function formatNumber(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

function formatCoord(n: number) {
  return Number.isFinite(n) ? n.toFixed(6) : "-";
}

const Page = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await dashboardService.getStations();
        const apiStations = response.data?.data ?? [];
        setStations(apiStations);
      } catch (error) {
        console.error("Error fetching stations:", error);
        setStations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const handleStationClick = (station: Station) => {
    setSelectedStation(station);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50">
      <Header />
      <div className="relative">
        <div className="w-full h-64 bg-linear-to-r from-blue-600 to-green-600 relative overflow-hidden">
          <Image
          width={1920}
          height={1080}
            src="/cam-nang-Metro.jpeg"
            alt="Metro Guide"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-linear-to-r from-blue-600/80 to-green-600/80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Các Nhà Ga MeBike
              </h1>
              <p className="text-xl md:text-2xl font-light">
                Bến Thành - Suối Tiên
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {stations.length} Ga
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  19.7 km
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Station Selection Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Chọn ga để xem thông tin chi tiết
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Đang tải dữ liệu trạm...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {stations.map((station, index) => (
                <div key={index} className="flex flex-col">
                  <Button
                    variant={
                      selectedStation?.name === station.name
                        ? "default"
                        : "outline"
                    }
                    className={`h-auto p-3 text-center transition-all duration-200 hover:scale-105 ${
                      selectedStation?.name === station.name
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                        : "hover:bg-blue-100 hover:border-blue-400"
                    }`}
                    onClick={() => handleStationClick(station)}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          selectedStation?.name === station.name
                            ? "bg-white text-blue-600"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-xs leading-tight">
                        {station.name?.replace("Ga ", "")}
                      </span>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        {selectedStation && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <Card className="max-w-4xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl md:text-3xl text-blue-800 mb-2">
                      {selectedStation.name}
                    </CardTitle>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">
                        ID: {selectedStation.id}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Địa chỉ
                  </h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedStation.address}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Tọa độ
                    </h3>
                    <p className="text-gray-600">
                      Lat: {formatCoord(selectedStation.location.latitude)}
                    </p>
                    <p className="text-gray-600">
                      Lng: {formatCoord(selectedStation.location.longitude)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Sức chứa
                    </h3>
                    <p className="text-gray-600">
                      Capacity: {formatNumber(selectedStation.capacity.total)}
                    </p>
                    <p className="text-gray-600">
                      Chỗ trống: {formatNumber(selectedStation.capacity.emptyPhysicalSlots)}
                    </p>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Tình trạng xe
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-green-700">Có sẵn</div>
                      <div className="text-xl font-bold text-green-800">
                        {formatNumber(selectedStation.bikes.available)}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-blue-700">Tổng xe</div>
                      <div className="text-xl font-bold text-blue-800">
                        {formatNumber(selectedStation.bikes.total)}
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-xs text-yellow-700">Đã đặt</div>
                      <div className="text-xl font-bold text-yellow-800">
                        {formatNumber(selectedStation.bikes.reserved)}
                      </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-red-700">Hỏng</div>
                      <div className="text-xl font-bold text-red-800">
                        {formatNumber(selectedStation.bikes.broken)}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-xs text-orange-700">Tạm ngưng hoạt động</div>
                      <div className="text-xl font-bold text-orange-800">
                        {formatNumber(selectedStation.bikes.disabled)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-700">Đang điều phối</div>
                      <div className="text-xl font-bold text-gray-800">
                        {formatNumber(selectedStation.bikes.redistributing)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedStation && (
          <div className="text-center py-12">
            <h3 className="text-xl text-gray-600 mb-2">
              Chọn một ga để xem thông tin chi tiết
            </h3>
            <p className="text-gray-500">
              Nhấn vào bất kỳ ga nào ở trên để tìm hiểu thêm về ga đó
            </p>
          </div>
        )}
      </div>
      <CTA/>
      <Footer />
    </div>
  );
};

export default Page;