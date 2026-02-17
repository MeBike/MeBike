"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DataTable } from "@/components/TableCustom";
import { ReportStats } from "@/components/reports/report-stats";
import { Button } from "@/components/ui/button";
import { reportColumns } from "@/columns/report-columns";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useUserReport } from "@/hooks/use-report";
import { userService } from "@/services/user.service";
import {
  UpdateReportSchema,
  type UpdateReportSchemaFormData,
} from "@/schemas/reportSchema";
import type { Report } from "@custom-types";
import type { ReportStatus } from "@/types";
import type { DetailUser } from "@custom-types";
import { formatDateUTC } from "@/utils/formatDateTime";
import Image from "next/image";
export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [staffList, setStaffList] = useState<DetailUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const {
    reports,
    refetchReports,
    isFetchingReports,
    pagination,
    reportOverview,
    updateReport,
    refreshReportOverview,
    reportById,
    getReportById,
    isLoadingReportById
  } = useUserReport({ hasToken: true , page : currentPage , limit : limit, id: selectedReport?._id, status: selectedStatus as ReportStatus || undefined });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<UpdateReportSchemaFormData>({
    resolver: zodResolver(UpdateReportSchema),
  });

  const currentStatus = watch("newStatus");
  // Get available status transitions based on current status
  const getAvailableStatuses = () => {
    const statusTransitions: Record<string, string[]> = {
      "": ["ĐANG CHỜ XỬ LÝ"],
      "ĐANG CHỜ XỬ LÝ": ["ĐANG CHỜ XỬ LÝ", "ĐANG XỬ LÝ", "ĐÃ HỦY"],
      "ĐANG XỬ LÝ": ["ĐANG XỬ LÝ", "ĐÃ GIẢI QUYẾT", "ĐÃ HỦY"],
      "ĐÃ GIẢI QUYẾT": ["ĐÃ GIẢI QUYẾT", "ĐÃ HỦY"],
      "ĐÃ HỦY": ["ĐÃ HỦY"],
    };
    return statusTransitions[currentStatus] || [];
  };

  useEffect(() => {
    refetchReports();
  }, [currentPage, refetchReports]);

  // Fetch staff list on mount
  useEffect(() => {
    setIsLoadingStaff(true);
    userService
      .getAllUsers({ role: "STAFF", limit: 100 })
      .then((res) => {
        setStaffList(res.data.data || []);
      })
      .catch((error) => {
        console.error("Failed to fetch staff list:", error);
        setStaffList([]);
      })
      .finally(() => {
        setIsLoadingStaff(false);
      });
  }, []);

  const handleViewReport = async (report: Report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
    await getReportById();
  };

  const handleUpdateReport = (report: Report) => {
    setSelectedReport(report);
    reset({
      newStatus: report.status,
      staff_id: report.assignee_id || "",
      priority: report.priority,
    });
    setIsUpdateModalOpen(true);
  };

  const onSubmit = async (data: UpdateReportSchemaFormData) => {
    if (!selectedReport) return;
    // try {
    //   const response = await reportService.updateReport(selectedReport._id, data);
    //   if (response?.status === 200) {
    //     toast.success("Cập nhật báo cáo thành công");
    //     setIsUpdateModalOpen(false);
    //     setSelectedReport(null);
    //     refetchReports();
    //   }
    // } catch (error: unknown) {
    //   const axiosError = error as {
    //     response?: {
    //       data?: {
    //         message?: string;
    //       };
    //     };
    //     message?: string;
    //   };
    //   const errorMessage =
    //     axiosError?.response?.data?.message ||
    //     axiosError?.message ||
    //     "Lỗi khi cập nhật báo cáo";
    //   toast.error(errorMessage);
    // }
    updateReport(selectedReport._id, data);
    setIsUpdateModalOpen(false);
    setSelectedReport(null);
  };

  useEffect(() => {
    refreshReportOverview();
  }, [refreshReportOverview]);

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

      {reportOverview && <ReportStats reports={reportOverview} />}

      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-foreground">Lọc theo trạng thái</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
          >
            <option value="">Tất cả</option>
            <option value="ĐANG CHỜ XỬ LÝ">Đang chờ xử lý</option>
            <option value="ĐANG XỬ LÝ">Đang xử lý</option>
            <option value="ĐÃ GIẢI QUYẾT">Đã giải quyết</option>
            <option value="ĐÃ HỦY">Đã hủy</option>
            <option value="KHÔNG GIẢI QUYẾT ĐƯỢC">Không giải quyết được</option>
          </select>
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
            staffList,
          })}
          data={reports || []}
          title="Danh sách báo cáo"
        />

        <div className="pt-3">
          <PaginationDemo
            currentPage={currentPage}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {isUpdateModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Cập nhật báo cáo
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Trạng thái
                </label>
                <select
                  {...register("newStatus")}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  <option value="">Chọn trạng thái</option>
                  {getAvailableStatuses().map((status) => (
                    <option key={status} value={status}>
                      {status === "ĐANG CHỜ XỬ LÝ"
                        ? "Đang chờ xử lý"
                        : status === "ĐANG XỬ LÝ"
                          ? "Đang xử lý"
                          : status === "ĐÃ GIẢI QUYẾT"
                            ? "Đã giải quyết" : status === "KHÔNG GIẢI QUYẾT ĐƯỢC" ? "Không thể giải quyết được"
                            : "Đã hủy"}
                    </option>
                  ))}
                </select>
                {errors.newStatus && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.newStatus?.message}
                  </div>
                )}
              </div>

              {/* Priority Field */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Ưu tiên
                </label>
                <select
                  {...register("priority")}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  <option value="">Chọn ưu tiên</option>
                  <option value="4 - THẤP">4 - THẤP</option>
                  <option value="3 - BÌNH THƯỜNG">
                    3 - BÌNH THƯỜNG
                  </option>
                  <option value="2 - CAO">2 - CAO</option>
                  <option value="1 - KHẨN CẤP">1 - KHẨN CẤP</option>
                </select>
                {errors.priority && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.priority?.message}
                  </div>
                )}
              </div>

              {/* Staff ID Field */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nhân viên xử lý
                </label>
                <select
                  {...register("staff_id")}
                  disabled={isLoadingStaff}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1 disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingStaff ? "Đang tải..." : "Chọn nhân viên"}
                  </option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullname} ({staff.email})
                    </option>
                  ))}
                </select>
                {errors.staff_id && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.staff_id?.message}
                  </div>
                )}
              </div>
            </form>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsUpdateModalOpen(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  "Cập nhật"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

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
                        <Image
                          key={index}
                          src={url}
                          alt={`Report ${index + 1}`}
                          width={200}
                          height={128}
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
    </div>
  );
}
