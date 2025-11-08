"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, X } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import { PaginationDemo } from "@/components/PaginationCustomer";
import type { SOS } from "@/types/SOS";
import { useSOS } from "@/hooks/use-sos";
import { sosColumns } from "@/columns/sos-columns";
import { useForm } from "react-hook-form";
import { RejectSOSSchema , rejectSOSSchema , ConfirmSOSSchema , confirmSOSSchema} from "@/schemas/sosSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadMultipleImagesToFirebase } from "@/lib/firebase";
export default function SOSPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    SOS["status"] | "all"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "details" | "notes">("info");
  const [selectedSOSId, setSelectedSOSId] = useState<string>("");
  const [actionType, setActionType] = useState<"confirm" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmPhotos, setConfirmPhotos] = useState<File[]>([]);
  const [rejectPhotos, setRejectPhotos] = useState<File[]>([]);
  const [isUploadingConfirm, setIsUploadingConfirm] = useState(false);
  const [isUploadingReject, setIsUploadingReject] = useState(false);

  // Confirm SOS Form
  const confirmForm = useForm<ConfirmSOSSchema>({
    resolver: zodResolver(confirmSOSSchema),
  });

  // Reject SOS Form
  const rejectForm = useForm<RejectSOSSchema>({
    resolver: zodResolver(rejectSOSSchema),
  });
  const {
    sosRequests,
    isLoading,
    refetchSOSRequest,
    sosDetail,
    refetchSOSDetail,
    confirmSOS,
    rejectSOS,
  } = useSOS({
    hasToken: true,
    page: currentPage,
    limit: limit,
    id: selectedSOSId,
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

  const handleConfirmSOS = confirmForm.handleSubmit(async (data) => {
    if (!selectedSOSId) return;
    try {
      setIsSubmitting(true);
      
      // Upload photos nếu có
      if (confirmPhotos.length > 0) {
        setIsUploadingConfirm(true);
        const uploadedUrls = await uploadMultipleImagesToFirebase(confirmPhotos, "sos/confirm");
        data.photos = uploadedUrls;
        setIsUploadingConfirm(false);
      }
      console.log(data)
      await confirmSOS(data, selectedSOSId);
      setIsDetailModalOpen(false);
      setSelectedSOSId("");
      setActionType(null);
      setConfirmPhotos([]);
      confirmForm.reset();
    } catch (error) {
      console.error("Error confirming SOS:", error);
      setIsUploadingConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleRejectSOS = rejectForm.handleSubmit(async (data) => {
    if (!selectedSOSId) return;
    try {
      setIsSubmitting(true);
      
      // Upload photos nếu có
      if (rejectPhotos.length > 0) {
        setIsUploadingReject(true);
        const uploadedUrls = await uploadMultipleImagesToFirebase(rejectPhotos, "sos/reject");
        data.photos = uploadedUrls;
        setIsUploadingReject(false);
      }
      
      console.log(data);
      await rejectSOS(data, selectedSOSId);
      setIsDetailModalOpen(false);
      setSelectedSOSId("");
      setActionType(null);
      setRejectPhotos([]);
      rejectForm.reset();
    } catch (error) {
      console.error("Error rejecting SOS:", error);
      setIsUploadingReject(false);
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSOSId("");
    setDetailTab("info");
    setActionType(null);
    setConfirmPhotos([]);
    setRejectPhotos([]);
    confirmForm.reset();
    rejectForm.reset();
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
              >
                Đóng
              </Button>
              {actionType === null && (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setActionType("confirm")}
                    disabled={sosDetail?.result?.status !== "ĐANG CHỜ XỬ LÍ"}
                  >
                    Xác nhận xử lý
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => setActionType("reject")}
                    disabled={sosDetail?.result?.status !== "ĐANG CHỜ XỬ LÍ"}
                  >
                    Từ chối
                  </Button>
                </>
              )}
            </div>

            {/* Confirm SOS Modal */}
            {actionType === "confirm" && (
              <div className="mt-6 p-4 border border-border rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Xác nhận xử lý yêu cầu cứu hộ
                </h3>
                <form onSubmit={handleConfirmSOS} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Có thể giải quyết được? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="true"
                          checked={confirmForm.watch("solvable") === true}
                          onChange={() => confirmForm.setValue("solvable", true)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-foreground">Có thể giải quyết</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="false"
                          checked={confirmForm.watch("solvable") === false}
                          onChange={() => confirmForm.setValue("solvable", false)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-foreground">Không thể giải quyết</span>
                      </label>
                    </div>
                    {confirmForm.formState.errors.solvable && (
                      <p className="text-xs text-red-500 mt-1">
                        {confirmForm.formState.errors.solvable.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Ghi chú xử lý <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...confirmForm.register("agent_notes")}
                      placeholder="Nhập ghi chú xử lý..."
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground resize-none"
                      rows={4}
                    />
                    {confirmForm.formState.errors.agent_notes && (
                      <p className="text-xs text-red-500 mt-1">
                        {confirmForm.formState.errors.agent_notes.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Hình ảnh đính kèm (tùy chọn)
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setConfirmPhotos((prev) => [...prev, ...files]);
                        }}
                        disabled={isUploadingConfirm}
                        className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-3 file:py-1 file:mr-2 disabled:opacity-50"
                      />
                      {confirmPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {confirmPhotos.map((file, idx) => (
                            <div
                              key={idx}
                              className="relative bg-muted rounded-lg p-2 text-xs flex items-center justify-between"
                            >
                              <span className="truncate text-foreground">
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmPhotos((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  );
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {confirmPhotos.length} hình ảnh được chọn
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setActionType(null)}
                      disabled={isSubmitting || isUploadingConfirm}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={isSubmitting || isUploadingConfirm}
                    >
                      {isSubmitting || isUploadingConfirm ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isUploadingConfirm ? "Đang tải ảnh..." : "Đang xử lý..."}
                        </>
                      ) : (
                        "Xác nhận"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Reject SOS Modal */}
            {actionType === "reject" && (
              <div className="mt-6 p-4 border border-border rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Từ chối yêu cầu cứu hộ
                </h3>
                <form onSubmit={handleRejectSOS} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Lý do từ chối <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...rejectForm.register("agent_notes")}
                      placeholder="Nhập lý do từ chối..."
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground resize-none"
                      rows={4}
                    />
                    {rejectForm.formState.errors.agent_notes && (
                      <p className="text-xs text-red-500 mt-1">
                        {rejectForm.formState.errors.agent_notes.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Hình ảnh đính kèm (tùy chọn)
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setRejectPhotos((prev) => [...prev, ...files]);
                        }}
                        disabled={isUploadingReject}
                        className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-3 file:py-1 file:mr-2 disabled:opacity-50"
                      />
                      {rejectPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {rejectPhotos.map((file, idx) => (
                            <div
                              key={idx}
                              className="relative bg-muted rounded-lg p-2 text-xs flex items-center justify-between"
                            >
                              <span className="truncate text-foreground">
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectPhotos((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  );
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {rejectPhotos.length} hình ảnh được chọn
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setActionType(null)}
                      disabled={isSubmitting || isUploadingReject}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      disabled={isSubmitting || isUploadingReject}
                    >
                      {isSubmitting || isUploadingReject ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isUploadingReject ? "Đang tải ảnh..." : "Đang xử lý..."}
                        </>
                      ) : (
                        "Từ chối"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
