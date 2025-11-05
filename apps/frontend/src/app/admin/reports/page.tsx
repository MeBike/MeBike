"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { ReportStats } from "@/components/reports/report-stats";
import { Button } from "@/components/ui/button";
import { reportColumns } from "@/columns/report-columns";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useUserReport } from "@/hooks/user-report";
import { reportService } from "@/services/report.service";
import type { Report } from "@/services/report.service";

export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const {
    reports,
    refetchReports,
    isFetchingReports,
    pagination,
  } = useUserReport({ hasToken: true });

  useEffect(() => {
    refetchReports();
  }, [currentPage, refetchReports]);

  const handleViewReport = (report: Report) => {
    console.log("[v0] View report:", report._id);
    // TODO: Implement view modal
  };

  const handleUpdateReport = (report: Report) => {
    setSelectedReport(report);
    setSelectedStatus(report.status);
    setIsUpdateModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedReport) return;
    try {
      await reportService.updateReportStatus(selectedReport._id, selectedStatus);
      setIsUpdateModalOpen(false);
      setSelectedReport(null);
      refetchReports();
    } catch (error) {
      console.error("Failed to update report status:", error);
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

      <ReportStats reports={reports} />

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

      {/* Update Status Modal */}
      {isUpdateModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Cập nhật trạng thái báo cáo
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Trạng thái mới
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="IN_PROGRESS">Đang xử lý</option>
                  <option value="RESOLVED">Đã giải quyết</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsUpdateModalOpen(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleStatusUpdate}
                className="flex-1"
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}