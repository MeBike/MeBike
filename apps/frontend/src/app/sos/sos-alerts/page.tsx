"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Upload, X } from "lucide-react";
import Image from "next/image";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import { PaginationDemo } from "@/components/PaginationCustomer";
import type { SOS } from "@/types/SOS";
import { useSOS } from "@/hooks/use-sos";
import { sosColumns } from "@/columns/sos-columns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resolveSOSSchema, type ResolveSOSSchema } from "@/schemas/sosSchema";
import { uploadMultipleImagesToFirebase } from "@/lib/firebase";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

export default function SOSPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SOS["status"] | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "details" | "notes">("info");
  const [selectedSOSId, setSelectedSOSId] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvePhotos, setResolvePhotos] = useState<File[]>([]);
  const [isUploadingResolve, setIsUploadingResolve] = useState(false);

  const {
    sosRequests,
    isLoading,
    refetchSOSRequest,
    sosDetail,
    refetchSOSDetail,
    confirmSOSRequest,
    resolveSOSRequest,
  } = useSOS({
    hasToken: true,
    page: currentPage,
    limit: limit,
    id: selectedSOSId,
  });

  const resolveForm = useForm<ResolveSOSSchema>({
    resolver: zodResolver(resolveSOSSchema),
    defaultValues: {
      solvable: true,
      agent_notes: "",
      photos: [],
    },
  });

  useEffect(() => {
    refetchSOSRequest();
  }, [currentPage, statusFilter, searchQuery, refetchSOSRequest]);

  useEffect(() => {
    if (selectedSOSId) {
      refetchSOSDetail();
    }
  }, [selectedSOSId, refetchSOSDetail]);

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };



  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSOSId("");
    setDetailTab("info");
  };

  const handleConfirm = async () => {
    if (!selectedSOSId) return;
    
    setIsConfirming(true);
    try {
      await confirmSOSRequest();
      await refetchSOSDetail();
      await refetchSOSRequest();
      setIsDetailModalOpen(false);
      setIsResolveModalOpen(true);
    } catch (error) {
      console.error("Error confirming SOS:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResolvePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setResolvePhotos(Array.from(e.target.files));
    }
  };

  const handleRemoveResolvePhoto = (index: number) => {
    setResolvePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmitResolve = async (data: ResolveSOSSchema) => {
    if (!selectedSOSId) return;

    setIsUploadingResolve(true);
    try {
      let photoUrls: string[] = [];
      if (resolvePhotos.length > 0) {
        photoUrls = await uploadMultipleImagesToFirebase(resolvePhotos);
      }

      await resolveSOSRequest({
        ...data,
        photos: photoUrls,
      });

      await refetchSOSDetail();
      await refetchSOSRequest();
      setIsResolveModalOpen(false);
      setSelectedSOSId("");
      setResolvePhotos([]);
      resolveForm.reset();
    } catch (error) {
      console.error("Error resolving SOS:", error);
    } finally {
      setIsUploadingResolve(false);
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
          {/* <Button onClick={() => setIsCreateModalOpen(true)}>
            Tạo yêu cầu cứu hộ
          </Button> */}
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
                <option value="ĐÃ GỬI NGƯỜI CỨU HỘ">Đã gửi người cứu hộ</option>
                <option value="ĐANG TRÊN ĐƯỜNG ĐẾN">Đang trên đường đến</option>
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
                        {sosDetail.result.sos_agent?.fullname || "Chưa có"}
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
                        {sosDetail.result.sos_agent?.phone_number || "Chưa có"}
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
                        {sosDetail.result.resolved_at
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
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {sosDetail.result.photos.map((photo, idx) => (
                              <div
                                key={idx}
                                className="bg-muted rounded-lg p-3 text-xs break-all hover:bg-muted/80 transition-colors"
                              >
                                <p className="font-mono text-xs mb-1">#{idx + 1}</p>
                                <p title={photo}>
                                  {photo.slice(0, 40)}...
                                </p>
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
                          {sosDetail.result.sos_agent?.fullname || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {sosDetail.result.sos_agent?.email || "-"}
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
                            ? new Date(sosDetail.result.created_at).toLocaleString("vi-VN")
                            : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Cập nhật cuối
                        </p>
                        <p className="text-foreground font-medium text-sm">
                          {sosDetail.result.updated_at
                            ? new Date(sosDetail.result.updated_at).toLocaleString("vi-VN")
                            : "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Thời gian xử lý
                        </p>
                        <p className="text-foreground font-medium text-sm">
                          {sosDetail.result.resolved_at
                            ? new Date(sosDetail.result.resolved_at).toLocaleString("vi-VN")
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
                onClick={handleCloseModal}
                className="flex-1"
                variant="outline"
              >
                Đóng
              </Button>
              {sosDetail?.result?.status === "ĐÃ GỬI NGƯỜI CỨU HỘ" && (
                <Button 
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={isConfirming}
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận xử lý"
                  )}
                </Button>
              )}
              {sosDetail?.result?.status === "ĐANG TRÊN ĐƯỜNG ĐẾN" && (
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsResolveModalOpen(true);
                  }}
                >
                  Hoàn thành xử lý
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve SOS Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Hoàn thành xử lý SOS
              </h2>
              <button
                onClick={() => {
                  setIsResolveModalOpen(false);
                  setResolvePhotos([]);
                  resolveForm.reset();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <Form {...resolveForm}>
              <form onSubmit={resolveForm.handleSubmit(onSubmitResolve)} className="space-y-4">
                <FormField
                  control={resolveForm.control}
                  name="solvable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tình trạng xử lý</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          value={field.value ? "true" : "false"}
                          onChange={(e) => field.onChange(e.target.value === "true")}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                        >
                          <option value="true">Đã xử lý thành công</option>
                          <option value="false">Không xử lý được</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resolveForm.control}
                  name="agent_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ghi chú xử lý</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Nhập ghi chú về quá trình xử lý..."
                          className="min-h-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hình ảnh xử lý</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleResolvePhotoChange}
                      className="hidden"
                      id="resolve-photo-upload"
                    />
                    <label
                      htmlFor="resolve-photo-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click để tải ảnh lên
                      </p>
                    </label>
                  </div>

                  {resolvePhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {resolvePhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={URL.createObjectURL(photo)}
                            alt={`Preview ${index + 1}`}
                            width={96}
                            height={96}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveResolvePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsResolveModalOpen(false);
                      setResolvePhotos([]);
                      resolveForm.reset();
                    }}
                    className="flex-1"
                    variant="outline"
                    disabled={isUploadingResolve}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isUploadingResolve}
                  >
                    {isUploadingResolve ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      "Hoàn thành"
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
