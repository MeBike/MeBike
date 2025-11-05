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
import { useUserReport } from "@/hooks/user-report";
import { reportService } from "@/services/report.service";
import { userService } from "@/services/user.service";
import { UpdateReportSchema, type UpdateReportSchemaFormData } from "@/schemas/reportSchema";
import type { Report } from "@custom-types";
import { DetailUser } from "@/services/auth.service";

export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [staffList, setStaffList] = useState<DetailUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  const {
    reports,
    refetchReports,
    isFetchingReports,
    pagination,
    reportOverview,
    updateReport,
  } = useUserReport({ hasToken: true });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateReportSchemaFormData>({
    resolver: zodResolver(UpdateReportSchema),
  });

  useEffect(() => {
    refetchReports();
  }, [currentPage, refetchReports]);

  // Fetch staff list when modal opens
  useEffect(() => {
    if (isUpdateModalOpen) {
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
    }
  }, [isUpdateModalOpen]);

  const handleViewReport = (report: Report) => {
    console.log("[v0] View report:", report._id);
  };

  const handleUpdateReport = (report: Report) => {
    setSelectedReport(report);
    reset({
      newStatus: report.status as any,
      staff_id: report.assignee_id || "",
      priority: report.priority,
    });
    setIsUpdateModalOpen(true);
  };

  const onSubmit = async (data: UpdateReportSchemaFormData) => {
    if (!selectedReport) return;
    try {
      await reportService.updateReport(selectedReport._id, data);
      setIsUpdateModalOpen(false);
      setSelectedReport(null);
      refetchReports();
    } catch (error) {
      console.error("Failed to update report:", error);
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

      {
        reportOverview && <ReportStats reports={reportOverview} />
      }

      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Hiển thị {currentPage} / {pagination?.totalPages ?? 1} trang
        </p>
        <DataTable
          columns={reportColumns({
            onView: handleViewReport,
            onUpdate: handleUpdateReport,
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

      {/* Update Report Modal */}
      {isUpdateModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Cập nhật báo cáo
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Status Field */}
              <div>
                <label className="text-sm font-medium text-foreground">
                  Trạng thái
                </label>
                <select
                  {...register("newStatus")}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  <option value="">Chọn trạng thái</option>
                  <option value="ĐANG CHỜ XỬ LÝ">Đang chờ xử lý</option>
                  <option value="ĐANG XỬ LÝ">Đang xử lý</option>
                  <option value="ĐÃ GIẢI QUYẾT">Đã giải quyết</option>
                  <option value="ĐÃ HỦY">Đã hủy</option>
                </select>
                {errors.newStatus && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.newStatus.message}
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
                  <option value="THẤP">Thấp</option>
                  <option value="BÌNH THƯỜNG">Bình thường</option>
                  <option value="CAO">Cao</option>
                  <option value="KHẨN CẤP">Khẩn cấp</option>
                </select>
                {errors.priority && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.priority.message}
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
                    <option key={staff._id} value={staff._id}>
                      {staff.fullname} ({staff.email})
                    </option>
                  ))}
                </select>
                {errors.staff_id && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.staff_id.message}
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
    </div>
  );
}