"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import { reportColumns } from "@/columns/report-columns-staff";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useUserReport } from "@/hooks/use-report";
import {
  ResolveReportSchema,
  type ResolveReportSchemaFormData,
} from "@/schemas/reportSchema";
import type { Report } from "@custom-types";
import { uploadMultipleImagesToFirebase } from "@/lib/firebase";
import { formatDateUTC } from "@/utils/formatDateTime";
export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const {
    refetchReports,
    isFetchingReports,
    pagination,
    getReportInProgress,
    reportInProgress,
    resolveReport,
    reportById,
    getReportById,
    isLoadingReportById,
  } = useUserReport({ 
    hasToken: true, 
    page: currentPage, 
    limit: limit,
    id: selectedReport?._id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ResolveReportSchemaFormData>({
    resolver: zodResolver(ResolveReportSchema),
  });

  // Get available status transitions based on current status
  const getAvailableStatuses = () => {
    // Staff chỉ có thể chọn 2 trạng thái: ĐÃ GIẢI QUYẾT hoặc KHÔNG GIẢI QUYẾT ĐƯỢC
    return ["ĐÃ GIẢI QUYẾT", "KHÔNG GIẢI QUYẾT ĐƯỢC"];
  };

  useEffect(() => {
    getReportInProgress();
  }, [currentPage, refetchReports, getReportInProgress]);


  const handleViewReport = async (report: Report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
    await getReportById();
  };

  const handleUpdateReport = (report: Report) => {
    setSelectedReport(report);
    setSelectedFiles([]);
    reset({
      newStatus: undefined,
      reason: "",
      files: [],
    });
    setIsUpdateModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ResolveReportSchemaFormData) => {
    if (!selectedReport) return;

    try {
      setIsUploadingFiles(true);
      let fileUrls: string[] = [];

      // Upload files to Firebase if any
      if (selectedFiles.length > 0) {
        fileUrls = await uploadMultipleImagesToFirebase(
          selectedFiles,
          `reports/${selectedReport._id}`
        );
      }

      // Merge uploaded URLs with form data
      const submitData = {
        ...data,
        files: fileUrls,
      };

      resolveReport(selectedReport._id, submitData);
      setIsUpdateModalOpen(false);
      setSelectedReport(null);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  if (isFetchingReports) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Quản lý báo cáo
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi và xử lý các báo cáo từ người dùng
          </p>
        </div>
      </div>


      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Hiển thị {currentPage} / {pagination?.totalPages ?? 1} trang
        </p>
        <DataTable
          columns={reportColumns({
            onView: handleViewReport,
            onUpdate: handleUpdateReport,
          })}
          data={reportInProgress?.data || []}
          title="Danh sách báo cáo"
        />

        <div className="pt-3">
          <PaginationDemo
            currentPage={currentPage}
            totalPages={reportInProgress?.pagination?.totalPages ?? 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Chi tiết báo cáo
              </h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingReportById ? (
              <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin w-12 h-12 text-primary" />
              </div>
            ) : reportById?.result ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground font-medium mb-2">Loại báo cáo</p>
                    <p className="text-base font-semibold text-foreground">{reportById.result.type}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground font-medium mb-2">Trạng thái</p>
                    <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary">
                      {reportById.result.status}
                    </span>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground font-medium mb-2">Độ ưu tiên</p>
                    <p className="text-base font-semibold text-foreground">{reportById.result.priority || "Không xác định"}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground font-medium mb-2">Ngày tạo</p>
                    <p className="text-base font-semibold text-foreground">
                      {formatDateUTC(reportById.result.created_at)}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-medium mb-2">Nội dung báo cáo</p>
                  <p className="text-base text-foreground leading-relaxed">{reportById.result.message}</p>
                </div>

                {reportById.result.location && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground font-medium mb-2">Vị trí</p>
                    <p className="text-base text-foreground">{reportById.result.location}</p>
                  </div>
                )}

                {reportById.result.media_urls && reportById.result.media_urls.length > 0 && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground font-medium mb-3">Hình ảnh đính kèm</p>
                    <div className="grid grid-cols-3 gap-3">
                      {reportById.result.media_urls.map((url: string, index: number) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Report ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => window.open(url, "_blank")}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Không tìm thấy thông tin báo cáo
              </div>
            )}

            <div className="flex justify-end mt-6 pt-6 border-t border-border">
              <Button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {isUpdateModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Cập nhật báo cáo
              </h2>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Trạng thái <span className="text-destructive">*</span>
                </label>
                <select
                  {...register("newStatus")}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Chọn trạng thái</option>
                  {getAvailableStatuses().map((status) => (
                    <option key={status} value={status}>
                      {status === "ĐÃ GIẢI QUYẾT"
                        ? "Đã giải quyết"
                        : "Không giải quyết được"}
                    </option>
                  ))}
                </select>
                {errors.newStatus && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.newStatus?.message}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Lý do giải quyết <span className="text-destructive">*</span>
                </label>
                <textarea
                  {...register("reason")}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  placeholder="Nhập lý do giải quyết báo cáo..."
                  rows={4}
                />
                {errors.reason && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.reason?.message}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Hình ảnh minh chứng
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-border rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-all group"
                    >
                      <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                        Chọn ảnh để tải lên
                      </span>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Đã chọn {selectedFiles.length} file
                      </p>
                      <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="relative group bg-muted/50 border border-border rounded-lg p-3 hover:bg-muted transition-all"
                          >
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="flex-shrink-0 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {errors.files && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.files?.message}
                  </div>
                )}
              </div>
            </form>

            <div className="flex gap-3 mt-8 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateModalOpen(false)}
                className="flex-1 py-6 text-base"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || isUploadingFiles}
                className="flex-1 py-6 text-base"
              >
                {isSubmitting || isUploadingFiles ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isUploadingFiles ? "Đang tải ảnh..." : "Đang cập nhật..."}
                  </>
                ) : (
                  "Cập nhật báo cáo"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
