"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import { PaginationDemo } from "@/components/PaginationCustomer";
import type { SOS } from "@/types/SOS";
import { useSOS } from "@/hooks/use-sos";
import { sosColumns } from "@/columns/sos-columns";
import { formatDateUTC } from "@/utils/formatDateTime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignSOSSchema, type AssignSOSSchema } from "@/schemas/sosSchema";
import { endRentalSchema, type EndRentalSchema } from "@/schemas/rentalSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@/components/ui/input";
import { useStationActions } from "@/hooks/use-station";
import { useUserActions } from "@/hooks/use-user";
import { useRentalsActions } from "@/hooks/use-rental";

export default function SOSPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SOS["status"] | "all">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "details" | "notes">(
    "info"
  );
  const [selectedSOSId, setSelectedSOSId] = useState<string>("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [selectedRentalId, setSelectedRentalId] = useState<string>("");
  const [isReplacingBike, setIsReplacingBike] = useState(false);
  const {endRental} = useRentalsActions({hasToken: true , rental_id: selectedRentalId});
  const {users} = useUserActions({hasToken: true});
  const {stations} = useStationActions({hasToken: true});
  const {
    sosRequests,
    isLoading,
    refetchSOSRequest,
    sosDetail,
    refetchSOSDetail,
    assignSOSRequest,
    createRentalRequest
  } = useSOS({
    hasToken: true,
    page: currentPage,
    limit: limit,
    id: selectedSOSId,
  });

  const latitude = sosDetail?.result?.location?.coordinates?.[1] || 0;
  const longitude = sosDetail?.result?.location?.coordinates?.[0] || 0;
  
  const {responseNearestAvailableBike , getNearestAvailableBike} = useStationActions({latitude, longitude});

  // Filter SOS agents from users
  const sosAgents = users?.filter((user: any) => user.role === "SOS") || [];

  const form = useForm<AssignSOSSchema>({
    resolver: zodResolver(assignSOSSchema),
    defaultValues: {
      replaced_bike_id: "",
      sos_agent_id: "",
    },
  });

  const endRentalForm = useForm<EndRentalSchema>({
    resolver: zodResolver(endRentalSchema),
    defaultValues: {
      end_station: "",
      end_time: "",
      reason: "",
    },
  });

  const onSubmitAssign = async (data: AssignSOSSchema) => {
    await assignSOSRequest(data);
    setIsAssignModalOpen(false);
    form.reset();
  };
  useEffect(() => {
    refetchSOSRequest();
  }, [currentPage, statusFilter, searchQuery, refetchSOSRequest]);

  useEffect(() => {
    if (selectedSOSId) {
      refetchSOSDetail();
    }
  }, [selectedSOSId, refetchSOSDetail]);

  useEffect(() => {
    if (latitude && longitude && isAssignModalOpen) {
      getNearestAvailableBike();
    }
  }, [latitude, longitude, isAssignModalOpen, getNearestAvailableBike]);

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const onSubmitReplaceBike = async (data: EndRentalSchema) => {
    setIsReplacingBike(true);
    
    try {
      // Format to keep local time: 2025-11-16T19:53:14.179+00:00
      const endTime = data.end_time + ':00.000+00:00';
      console.log("Ending rental with time:", endTime);
      await endRental({
        ...data,
        end_time: endTime,
      });
      
      // Step 2: Create new rental
      await createRentalRequest();
      
      // Refresh data
      await refetchSOSRequest();
      await refetchSOSDetail();
      
      setIsReplaceModalOpen(false);
      endRentalForm.reset();
    } catch (error) {
      console.error("Error replacing bike:", error);
      alert("Lỗi khi thay xe");
    } finally {
      setIsReplacingBike(false);
    }
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý yêu cầu cứu hộ
            </h1>
            <p className="text-muted-foreground mt-1">
              Theo dõi và quản lý các yêu cầu cứu hộ từ người dùng
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Bộ lọc</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Xóa bộ lọc
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Mã yêu cầu, mã người dùng, mã xe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as SOS["status"] | "all");
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">Tất cả</option>
                <option value="ĐANG CHỜ XỬ LÍ">Đang chờ xử lý</option>
                <option value="ĐÃ XỬ LÍ">Đã xử lý</option>
                <option value="KHÔNG XỬ LÍ ĐƯỢC">Không xử lý được</option>
                <option value="ĐÃ TỪ CHỐI">Đã từ chối</option>
              </select>
            </div>
          </div>
        </div>

        {/* SOS Requests Table */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị trang {currentPage}
          </p>

          {sosRequests?.data && sosRequests.data.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">
                Không có yêu cầu cứu hộ
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Không tìm thấy yêu cầu cứu hộ nào phù hợp với bộ lọc
              </p>
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <DataTable
                  title="Danh sách đơn cứu hộ"
                  columns={sosColumns({
                    onView: (sos: SOS) => {
                      setSelectedSOSId(sos._id);
                      setIsDetailModalOpen(true);
                    },
                  })}
                  data={sosRequests?.data || []}
                />
              </div>

              <div className="pt-3">
                <PaginationDemo
                  currentPage={currentPage}
                  totalPages={1}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail SOS Modal */}
      {isDetailModalOpen && sosDetail?.result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Chi tiết yêu cầu cứu hộ
              </h2>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedSOSId("");
                  setDetailTab("info");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {!sosDetail?.result ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
              </div>
            ) : (
              <>
                {/* Tabs for different sections */}
                <div className="flex gap-2 mb-6 border-b border-border">
                  <button
                    onClick={() => setDetailTab("info")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      detailTab === "info"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Thông tin
                  </button>
                  <button
                    onClick={() => setDetailTab("details")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      detailTab === "details"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Chi tiết vấn đề
                  </button>
                  <button
                    onClick={() => setDetailTab("notes")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      detailTab === "notes"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ghi chú xử lý
                  </button>
                </div>

                {/* Tab: Info */}
                {detailTab === "info" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Mã yêu cầu cứu hộ
                      </p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result._id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tên người yêu cầu
                      </p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.requester?.fullname || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Email người yêu cầu
                      </p>
                      <p className="text-foreground font-medium text-sm">
                        {sosDetail.result.requester?.email || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Số điện thoại người yêu cầu
                      </p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.requester?.phone_number || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Mã xe đạp</p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.bike?._id || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Chip ID xe đạp
                      </p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.bike?.chip_id || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Trạng thái xe đạp
                      </p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.bike?.status || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tên nhân viên SOS
                      </p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.sos_agent?.fullname ||
                          "Chưa được giao"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Email nhân viên SOS
                      </p>
                      <p className="text-foreground font-medium text-sm">
                        {sosDetail.result.sos_agent?.email || "Chưa có"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Số điện thoại nhân viên SOS
                      </p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.sos_agent?.phone_number ||
                          "Chưa được giao"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Trạng thái
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sosDetail.result.status === "ĐÃ XỬ LÍ"
                            ? "bg-green-100 text-green-800"
                            : sosDetail.result.status === "ĐANG CHỜ XỬ LÍ"
                              ? "bg-yellow-100 text-yellow-800"
                              : sosDetail.result.status === "KHÔNG XỬ LÍ ĐƯỢC"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sosDetail.result.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Ngày tạo</p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.created_at
                          ? new Date(
                              sosDetail.result.created_at
                            ).toLocaleString("vi-VN")
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Lần cập nhật cuối
                      </p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.updated_at
                          ? new Date(
                              sosDetail.result.updated_at
                            ).toLocaleString("vi-VN")
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Thời gian xử lý
                      </p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.resolved_at &&
                        sosDetail.result.resolved_at !== null
                          ? new Date(
                              sosDetail.result.resolved_at
                            ).toLocaleString("vi-VN")
                          : "Chưa xử lý"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab: Details */}
                {detailTab === "details" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Mô tả vấn đề
                      </p>
                      <p className="text-foreground bg-muted rounded-lg p-3 whitespace-pre-wrap">
                        {sosDetail.result.issue}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Kinh độ
                        </p>
                        <p className="text-foreground font-medium">
                          {sosDetail.result.location?.coordinates?.[0] || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Vĩ độ
                        </p>
                        <p className="text-foreground font-medium">
                          {sosDetail.result.location?.coordinates?.[1] || "-"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Loại vị trí
                      </p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.location?.type || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Hình ảnh đính kèm
                      </p>
                      {sosDetail.result.photos &&
                      sosDetail.result.photos.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-foreground">
                            Tổng cộng: {sosDetail.result.photos.length} hình ảnh
                          </p>
                          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                            {sosDetail.result.photos.map((photo, idx) => (
                              <div
                                key={idx}
                                className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted group"
                              >
                                <img
                                  src={photo}
                                  alt={`SOS photo ${idx + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  loading="lazy"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1">
                                  Ảnh #{idx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                          Không có hình ảnh đính kèm
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Notes */}
                {detailTab === "notes" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Ghi chú xử lý
                      </p>
                      <p className="text-foreground bg-muted rounded-lg p-3 whitespace-pre-wrap min-h-24">
                        {sosDetail.result.agent_notes || "Chưa có ghi chú"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Nhân viên SOS
                        </p>
                        <p className="text-foreground font-medium">
                          {sosDetail.result.sos_agent?.fullname ||
                            "Chưa được giao"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {sosDetail.result.sos_agent?.email || "Chưa có"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Nhân viên xử lý
                        </p>
                        <p className="text-foreground font-medium">
                          {sosDetail.result.staff_id ? "Đã gán" : "Chưa gán"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Ngày tạo
                        </p>
                        <p className="text-foreground font-medium text-sm">
                          {sosDetail.result.created_at
                            ? formatDateUTC(sosDetail.result.created_at)
                            : "Chưa có"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Cập nhật cuối
                        </p>
                        <p className="text-foreground font-medium text-sm">
                          {sosDetail.result.updated_at
                            ? formatDateUTC(sosDetail.result.updated_at)
                            : "Chưa có"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Thời gian xử lý
                        </p>
                        <p className="text-foreground font-medium text-sm">
                          {sosDetail.result.resolved_at &&
                          sosDetail.result.resolved_at !== null
                            ? formatDateUTC(sosDetail.result.resolved_at)
                            : "Chưa xử lý"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Trạng thái hiện tại
                        </p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                            sosDetail.result.status === "ĐÃ XỬ LÍ"
                              ? "bg-green-100 text-green-800"
                              : sosDetail.result.status === "ĐANG CHỜ XỬ LÍ"
                                ? "bg-yellow-100 text-yellow-800"
                                : sosDetail.result.status === "KHÔNG XỬ LÍ ĐƯỢC"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sosDetail.result.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedSOSId("");
                  setDetailTab("info");
                }}
                className="flex-1"
                variant="outline"
              >
                Đóng
              </Button>
              {sosDetail.result.status === "ĐANG CHỜ XỬ LÍ" && (
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setIsAssignModalOpen(true);
                  }}
                >
                  Phân công xử lý
                </Button>
              )}
              {(sosDetail.result.status === "KHÔNG XỬ LÍ ĐƯỢC" || sosDetail.result.status.includes("KHÔNG XỬ LÍ")) && (
                <Button 
                  className="flex-1"
                  onClick={() => {
                    console.log("Status:", sosDetail.result.status);
                    console.log("Rental:", (sosDetail.result as any).rental);
                    const rentalId = (sosDetail.result as any).rental?._id;
                    if (!rentalId) {
                      alert("Không tìm thấy thông tin thuê xe");
                      return;
                    }
                    setSelectedRentalId(rentalId);
                    setIsReplaceModalOpen(true);
                    // Pre-fill form with rental station info
                    const startStation = (sosDetail.result as any).rental?.start_station;
                    if (startStation) {
                      endRentalForm.setValue("end_station", startStation);
                    }
                    // Set current time in datetime-local format (YYYY-MM-DDTHH:mm)
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const seconds = String(now.getSeconds()).padStart(2, '0');
                    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
                    const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
                    endRentalForm.setValue("end_time", datetimeLocal);
                    endRentalForm.setValue("reason", "Không xử lý được - Thay xe mới");
                  }}
                >
                  Thay xe
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign SOS Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Phân công xử lý SOS
              </h2>
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  form.reset();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitAssign)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="replaced_bike_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xe thay thế</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground truncate"
                        >
                          <option value="">Chọn xe thay thế</option>
                          {responseNearestAvailableBike?.data?.result ? (
                            <option 
                              value={(responseNearestAvailableBike.data.result as any).bike_id}
                              className="truncate"
                            >
                              {(responseNearestAvailableBike.data.result as any).chip_id}km
                            </option>
                          ) : null}
                        </select>
                      </FormControl>
                      {responseNearestAvailableBike?.data?.result && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Trạm: {(responseNearestAvailableBike.data.result as any).station_name}
                        </p>
                      )}
                      <FormMessage />
                      {!responseNearestAvailableBike?.data?.result && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Không tìm thấy xe khả dụng gần đó
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sos_agent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nhân viên SOS</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        >
                          <option value="">Chọn nhân viên SOS</option>
                          {sosAgents?.map((agent: any) => (
                            <option key={agent._id} value={agent._id}>
                              {agent.fullname} - {agent.email}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                      {sosAgents && sosAgents.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Không có nhân viên SOS khả dụng
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAssignModalOpen(false);
                      form.reset();
                    }}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      "Phân công"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Replace Bike Modal */}
      {isReplaceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Thay xe mới
              </h2>
              <button
                onClick={() => {
                  setIsReplaceModalOpen(false);
                  endRentalForm.reset();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <Form {...endRentalForm}>
              <form onSubmit={endRentalForm.handleSubmit(onSubmitReplaceBike)} className="space-y-4">
                <FormField
                  control={endRentalForm.control}
                  name="end_station"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạm trả xe</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        >
                          <option value="">Chọn trạm trả xe</option>
                          {stations?.map((station: any) => (
                            <option key={station._id} value={station._id}>
                              {station.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={endRentalForm.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thời gian kết thúc</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={endRentalForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lý do</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nhập lý do kết thúc thuê xe..."
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsReplaceModalOpen(false);
                      endRentalForm.reset();
                    }}
                    className="flex-1"
                    disabled={isReplacingBike}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isReplacingBike}
                  >
                    {isReplacingBike ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      "Xác nhận thay xe"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
