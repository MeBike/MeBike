"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useStationActions } from "@/hooks/useStationAction";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationSchema, StationSchemaFormData } from "@/schemas/stationSchema";
import { Input } from "@/components/ui/input";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import * as tt from "@tomtom-international/web-sdk-maps";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { stationColumns } from "@/columns/station-column";
// MAIN
export default function StationsPage() {
  // STATES
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<tt.Map | null>(null);
  const editMapRef = useRef<HTMLDivElement>(null);
  const editMapInstanceRef = useRef<tt.Map | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [stationID, setStationID] = useState<string>("");
  const {
    getAllStations,
    stations,
    paginationStations,
    createStation,
    deleteStation,
    getStationByID,
    responseStationDetail,
    isLoadingGetStationByID,
    updateStation,
    getReservationStats,
    responseStationReservationStats,
  } = useStationActions({
    hasToken: true,
    page: page,
    limit: limit,
    stationId: stationID,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // FORM CREATE
  const {
    register: createRegister,
    handleSubmit: handleCreateSubmit,
    setValue: setCreateValue,
    reset: resetCreate,
    formState: { errors: createErrors },
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

  // FORM EDIT
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
    reset: resetEdit,
    formState: { errors: editErrors },
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

  // LOAD DATA
  useEffect(() => {
    getAllStations();
  }, [limit, page, getAllStations]);
  useEffect(() => {
    getStationByID();
    getReservationStats();
  }, [stationID, getStationByID, getReservationStats]);
  useEffect(() => {
    console.log(responseStationDetail);
  }, [responseStationDetail]);

  // Khi mở Edit Modal, reset form với dữ liệu chi tiết
  useEffect(() => {
    if (isEditModalOpen && responseStationDetail) {
      resetEdit({
        name: responseStationDetail.name,
        address: responseStationDetail.address,
        latitude: responseStationDetail.latitude,
        longitude: responseStationDetail.longitude,
        capacity: responseStationDetail.capacity,
      });
    }
  }, [isEditModalOpen, responseStationDetail, resetEdit]);

  // MAP FOR CREATE MODAL
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    const markerRef = { current: null as tt.Marker | null };

    if (isModalOpen && mapRef.current && !mapInstanceRef.current) {
      timer = setTimeout(() => {
        const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY
        mapInstanceRef.current = tt.map({
          key: apiKey as string,
          container: mapRef.current as HTMLElement,
          center: [106.70098, 10.77689],
          zoom: 14,
          style:
            "https://api.tomtom.com/style/1/style/20.3.2-*?map=hybrid_main",
        });

        setTimeout(() => {
          mapInstanceRef.current?.resize();
        }, 300);

        // Select location by click
        mapInstanceRef.current.on("click", function (e) {
          const { lat, lng } = e.lngLat;
          setCreateValue("latitude", lat.toString());
          setCreateValue("longitude", lng.toString());

          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
          } else {
            markerRef.current = new tt.Marker({ draggable: false })
              .setLngLat([lng, lat])
              .addTo(mapInstanceRef.current!);
          }
        });
      }, 400);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (!isModalOpen && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isModalOpen, setCreateValue]);

  // MAP FOR EDIT MODAL
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    const editMarkerRef = { current: null as tt.Marker | null };

    if (
      isEditModalOpen &&
      editMapRef.current &&
      !editMapInstanceRef.current &&
      responseStationDetail?.latitude &&
      responseStationDetail?.longitude
    ) {
      timer = setTimeout(() => {
        const apiKey =
          process.env.NEXT_PUBLIC_TOMTOM_API_KEY
        const lat = parseFloat(responseStationDetail.latitude);
        const lng = parseFloat(responseStationDetail.longitude);

        editMapInstanceRef.current = tt.map({
          key: apiKey as string,
          container: editMapRef.current as HTMLElement,
          center: [lng, lat],
          zoom: 14,
          style: "https://api.tomtom.com/style/1/style/20.3.2-*?map=basic_main",
        });

        setTimeout(() => {
          editMapInstanceRef.current?.resize();
        }, 300);

        // Add initial marker at existing location
        editMarkerRef.current = new tt.Marker({ draggable: false })
          .setLngLat([lng, lat])
          .addTo(editMapInstanceRef.current!);

        // Update position on click
        editMapInstanceRef.current.on("click", function (e) {
          const { lat, lng } = e.lngLat;
          setEditValue("latitude", lat.toString());
          setEditValue("longitude", lng.toString());

          if (editMarkerRef.current) {
            editMarkerRef.current.setLngLat([lng, lat]);
          } else {
            editMarkerRef.current = new tt.Marker({ draggable: false })
              .setLngLat([lng, lat])
              .addTo(editMapInstanceRef.current!);
          }
        });
      }, 400);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (!isEditModalOpen && editMapInstanceRef.current) {
        editMapInstanceRef.current.remove();
        editMapInstanceRef.current = null;
      }
    };
  }, [isEditModalOpen, responseStationDetail, setEditValue]);

  // ADD STATION
  const handleAddStation = (data: StationSchemaFormData) => {
    createStation(data);
    resetCreate();
    setIsModalOpen(false);
  };

  // EDIT STATION
  const handleEditStation = (data: StationSchemaFormData) => {
    updateStation(data);
    setIsEditModalOpen(false);
  };

  // UI
  return (
    <div>
      {/* HEADER */}
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
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Thêm trạm mới
            </Button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng số trạm</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {paginationStations?.totalRecords}
            </p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc địa chỉ trạm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground"
            />
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Đặt lại
            </Button>
          </div>
        </div>

        {/* TABLE & PAGINATION */}
        <div className="w-full rounded-lg space-y-4 flex flex-col">
          <div>
            <DataTable
              title="Danh sách trạm xe"
              columns={stationColumns({
                onDelete: ({ id }) => deleteStation(id),
                onEdit: ({ id }) => {
                  setStationID(id);
                  setIsEditModalOpen(true);
                },
                onView: ({ id }) => {
                  setStationID(id);
                  setIsDetailModalOpen(true);
                },
              })}
              data={stations ?? []}
            />
          </div>
          <div>
            <PaginationDemo
              totalPages={paginationStations?.totalPages ?? 1}
              currentPage={paginationStations?.currentPage ?? 1}
              onPageChange={setPage}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Hiển thị {paginationStations?.totalRecords} /{" "}
          {paginationStations?.totalRecords} trạm
        </p>
      </div>

      {/* ADD MODAL */}
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
              onSubmit={handleCreateSubmit(handleAddStation)}
            >
              <label className="block text-sm font-medium text-foreground mb-1">
                Tên trạm
              </label>
              <Input
                type="text"
                {...createRegister("name")}
                placeholder="Nhập tên trạm"
              />
              {createErrors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {createErrors.name.message}
                </p>
              )}
              <label className="block text-sm font-medium text-foreground mb-1">
                Địa chỉ
              </label>
              <Input
                type="text"
                {...createRegister("address")}
                placeholder="Nhập địa chỉ trạm"
              />
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Latitude
                  </label>
                  <Input type="text" {...createRegister("latitude")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Longitude
                  </label>
                  <Input type="text" {...createRegister("longitude")} />
                </div>
              </div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Sức chứa (số xe)
              </label>
              <Input
                type="text"
                {...createRegister("capacity")}
                placeholder="Nhập sức chứa"
              />
              {createErrors.capacity && (
                <p className="text-sm text-red-500 mt-1">
                  {createErrors.capacity.message}
                </p>
              )}
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

      {/* EDIT MODAL */}
      {isEditModalOpen && stationID && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {isLoadingGetStationByID ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
              <span className="text-lg text-foreground">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Chỉnh sửa trạm
                </h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <form
                className="space-y-4"
                onSubmit={handleEditSubmit(handleEditStation)}
              >
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tên trạm
                </label>
                <Input
                  type="text"
                  {...editRegister("name")}
                  placeholder="Nhập tên trạm"
                />
                {editErrors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {editErrors.name.message}
                  </p>
                )}
                <label className="block text-sm font-medium text-foreground mb-1">
                  Địa chỉ
                </label>
                <Input
                  type="text"
                  {...editRegister("address")}
                  placeholder="Nhập địa chỉ trạm"
                />
                <label className="block text-sm font-medium text-foreground mb-1">
                  Chọn vị trí trên bản đồ
                </label>
                <div
                  ref={editMapRef}
                  id="edit-map"
                  style={{
                    width: "100%",
                    height: "300px",
                    backgroundColor: "#e5e7eb",
                  }}
                ></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Latitude
                    </label>
                    <Input type="text" {...editRegister("latitude")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Longitude
                    </label>
                    <Input type="text" {...editRegister("longitude")} />
                  </div>
                </div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Sức chứa (số xe)
                </label>
                <Input
                  type="text"
                  {...editRegister("capacity")}
                  placeholder="Nhập sức chứa"
                />
                {editErrors.capacity && (
                  <p className="text-sm text-red-500 mt-1">
                    {editErrors.capacity.message}
                  </p>
                )}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" className="flex-1">
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {isDetailModalOpen && stationID && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {isLoadingGetStationByID ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
              <span className="text-lg text-foreground">
                Đang tải dữ liệu...
              </span>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Chi tiết trạm xe
                </h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Tên trạm
                  </label>
                  <p className="text-foreground font-medium">
                    {responseStationDetail?.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Địa chỉ
                  </label>
                  <p className="text-foreground">
                    {responseStationDetail?.address}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Latitude
                    </label>
                    <p className="text-foreground">
                      {responseStationDetail?.latitude}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Longitude
                    </label>
                    <p className="text-foreground">
                      {responseStationDetail?.longitude}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Sức chứa
                  </label>
                  <p className="text-foreground">
                    {responseStationDetail?.capacity} xe
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Ngày tạo
                    </label>
                    <p className="text-foreground text-sm">
                      {new Date(
                        responseStationDetail?.created_at || ""
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Cập nhật lần cuối
                    </label>
                    <p className="text-foreground text-sm">
                      {new Date(
                        responseStationDetail?.updated_at || ""
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>

                {/* Reservation Stats */}
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
                          {responseStationReservationStats.result.status_counts.Pending || "0"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Đã hủy
                        </label>
                        <p className="text-foreground font-medium">
                          {responseStationReservationStats.result.status_counts.Cancelled || "0"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Đã hết hạn
                        </label>
                        <p className="text-foreground font-medium">
                          {responseStationReservationStats.result.status_counts.Expired || "0"}
                        </p>
                      </div>
                      {/* <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Đã hết hạn
                        </label>
                        <p className="text-foreground font-medium">
                          {responseStationReservationStats.result.status_counts["ĐÃ HẾT HẠN"]}
                        </p>
                      </div> */}
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Xe đang đặt trước
                        </label>
                        <p className="text-foreground font-medium">
                          {responseStationReservationStats.result.reserving_bikes.length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-full"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
