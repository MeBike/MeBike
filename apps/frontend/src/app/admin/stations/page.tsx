"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import type { Station } from "@custom-types";
import { DetailUser } from "@/services/auth.service";
import { Plus, Download, Edit2, Trash2, Eye, X } from "lucide-react";
import { useStationActions } from "@/hooks/useStationAction";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/stationSchema";
import { Input } from "@/components/ui/input";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import * as tt from "@tomtom-international/web-sdk-maps";
// Mock data

const mockStations: Station[] = [
  {
    _id: "68e0b2ae63beb4054de09d10",
    name: "Ga Bến Thành",
    address: "Quận 1, TP.HCM",
    latitude: "10.7620",
    longitude: "106.6900",
    capacity: "20",
    created_at: "2025-10-18T19:57:05.496Z",
    updated_at: "2025-10-18T19:57:05.496Z",
    location_geo: {
      type: "Point",
      coordinates: [106.69, 10.762],
    },
  },
  {
    _id: "68e0b2ae63beb4054de09d11",
    name: "Nhà hát Thành phố",
    address: "Quận 1, TP.HCM",
    latitude: "10.7730",
    longitude: "106.7020",
    capacity: "25",
    created_at: "2025-10-18T19:57:05.496Z",
    updated_at: "2025-10-18T19:57:05.496Z",
    location_geo: {
      type: "Point",
      coordinates: [106.702, 10.773],
    },
  },
  {
    _id: "68e0b2ae63beb4054de09d12",
    name: "Ba Son",
    address: "Quận 1, TP.HCM",
    latitude: "10.7550",
    longitude: "106.7150",
    capacity: "15",
    created_at: "2025-10-18T19:57:05.496Z",
    updated_at: "2025-10-18T19:57:05.496Z",
    location_geo: {
      type: "Point",
      coordinates: [106.715, 10.755],
    },
  },
];

export default function StationsPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<tt.Map | null>(null);

  const { getAllStations, stations, paginationStations, createStation } =
    useStationActions(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    capacity: "",
  });

  const {
    register: create,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StationSchemaFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      capacity: "",
    },
  });

  useEffect(() => {
    getAllStations();
  }, []);
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isModalOpen && mapRef.current && !mapInstanceRef.current) {
      timer = setTimeout(() => {
        if (mapRef.current && mapRef.current.offsetHeight > 0) {
          const apiKey =
            process.env.NEXT_PUBLIC_TOMTOM_API_KEY ||
            "N5uyS5ZiQ4Uwxmu0JqgpLXG0exsrmeMP";
          mapInstanceRef.current = tt.map({
            key: apiKey,
            container: mapRef.current as HTMLElement,
            center: [106.70098, 10.77689],
            zoom: 12,
            style:
              "https://api.tomtom.com/style/1/style/20.3.2-*?map=hybrid_main&traffic_incidents=incidents_day&traffic_flow=flow_relative0",
          });
          setTimeout(() => {
            mapInstanceRef.current?.resize();
          }, 300);
          mapInstanceRef.current.on("click", function (e) {
            setValue("latitude", e.lngLat.lat.toString());
            setValue("longitude", e.lngLat.lng.toString());
          });
          new tt.Marker()
            .setLngLat([106.69, 10.762])
            .addTo(mapInstanceRef.current);
        }
      }, 400);
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (!isModalOpen && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isModalOpen, setValue]);

  const handleAddStation = (data: StationSchemaFormData) => {
    console.log("[v0] Adding station:", data);
    createStation({
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      capacity: data.capacity,
    });
    setFormData({
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      capacity: "",
    });
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý trạm xe
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách trạm xe đạp
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button> */}
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm trạm mới
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng số trạm</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {paginationStations?.totalRecords}
            </p>
          </div>
          {/* <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-500 mt-1">
              {mockStations.filter((s) => s.status === "HOẠT ĐỘNG").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Ngưng hoạt động</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {
                mockStations.filter((s) => s.status === "NGƯNG HOẠT ĐỘNG")
                  .length
              }
            </p>
          </div> */}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc địa chỉ trạm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground"
            />
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
              }}
            >
              Đặt lại
            </Button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Tên trạm
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Địa chỉ
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Sức chứa
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Tọa độ
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stations.map((station) => (
                <tr
                  key={station._id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    {station.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {station.address}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {station.capacity} xe
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {station.latitude}, {station.longitude}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(station.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Results info */}
        <p className="text-sm text-muted-foreground">
          Hiển thị {paginationStations?.totalRecords} /{" "}
          {paginationStations?.totalRecords} trạm
        </p>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Thêm trạm mới
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={handleSubmit(handleAddStation)}
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tên trạm
                </label>
                <Input
                  type="text"
                  id="name"
                  {...create("name")}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Nhập tên trạm"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Địa chỉ
                </label>
                <Input
                  type="text"
                  id="address"
                  {...create("address")}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Nhập địa chỉ trạm"
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Latitude
                  </label>
                  <Input
                    type="text"
                    id="latitude"
                    {...create("latitude")}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    placeholder="10.7620"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Longitude
                  </label>
                  <Input
                    type="text"
                    id="longitude"
                    {...create("longitude")}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    placeholder="106.6900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Sức chứa (số xe)
                </label>
                <Input
                  type="text"
                  id="capacity"
                  {...create("capacity")}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Nhập sức chứa"
                />
                {errors.capacity && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.capacity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Chọn vị trí trên bản đồ
                </label>
                <div
                  ref={mapRef}
                  id="map"
                  style={{
                    width: "100%",
                    height: "300px",
                    backgroundColor: "#e5e7eb",
                  }}
                ></div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button type="submit" className="flex-1">
                  Thêm trạm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
