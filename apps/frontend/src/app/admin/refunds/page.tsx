"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { RefundRequest, RefundStatus } from "@custom-types";
import { Download } from "lucide-react";
import { useRefundAction } from "@/hooks/useRefundAction";
import { refundColumn } from "@/columns/refund-column";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { DataTable } from "@/components/TableCustom";
import { getStatusColor, getStatusIcon, getStatusLabel } from "@/utils/refund-status";
function InfoRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p
        className={`${
          mono ? "font-mono" : "font-medium"
        } ${highlight ? "text-lg font-bold text-foreground" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function RefundPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RefundStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(
    null
  );
  const [selectedID, setSelectedID] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit,] = useState(10);
  const {
    response,
    refetch,
    pagination,
    getAllRefundRequest,
    detailResponse,
    isDetailLoading,
    updateRefundRequest,
  } = useRefundAction({
    hasToken: true,
    page: page,
    limit: limit,
    id: selectedID || "",
    status: statusFilter === "all" ? undefined : (statusFilter as RefundStatus),
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RefundStatus>("ĐANG CHỜ XỬ LÝ");
  useEffect(() => {
    getAllRefundRequest();
  }, [page, limit, statusFilter, searchQuery, refetch , getAllRefundRequest]);

  const refundTransitions = useMemo((): Record<RefundStatus, RefundStatus[]> => ({
    "": ["ĐANG CHỜ XỬ LÝ"],
    "ĐANG CHỜ XỬ LÝ": ["ĐÃ DUYỆT", "TỪ CHỐI"],
    "ĐÃ DUYỆT": ["ĐÃ HOÀN THÀNH"],
    "TỪ CHỐI": [],
    "ĐÃ HOÀN THÀNH": [],
  }), []);
const handleSaveStatus = async () => {
  if (!selectedRequest?._id) return;
  await updateRefundRequest({
    newStatus: newStatus,
  });
  setIsUpdateModalOpen(false);
};
  useEffect(() => {
    getAllRefundRequest();
    console.log(detailResponse)
  }, [selectedID , detailResponse, getAllRefundRequest]);
  useEffect(() => {
    console.log(detailResponse);
  }, [detailResponse]);
  const getNextStatuses = useCallback((current: RefundStatus): RefundStatus[] => {
    return (refundTransitions[current] ?? []).filter((s) => s !== current);
  }, [refundTransitions]);
  const nextStatuses = getNextStatuses(detailResponse?.status as RefundStatus);
  useEffect(() => {
    console.log("Next statuses:", newStatus);
  }, [newStatus]);
  useEffect(() => {
    if (detailResponse?.status) {
      setNewStatus(detailResponse.status as RefundStatus);
    }
  }, [detailResponse]);
  useEffect(() => {
    const next = getNextStatuses(detailResponse?.status as RefundStatus);
    if (next.length > 0) setNewStatus(next[0]);
  }, [detailResponse , getNextStatuses]);
  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý hoàn tiền
            </h1>
            <p className="text-muted-foreground mt-1">
              Xem và xử lý các yêu cầu hoàn tiền từ người dùng
            </p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng số yêu cầu</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {pagination?.totalRecords}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Chờ xử lý</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as RefundStatus | "all")
              }
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ĐANG CHỜ XỬ LÝ">Chờ xử lý</option>
              <option value="ĐÃ DUYỆT">Đã phê duyệt</option>
              <option value="ĐÃ HOÀN THÀNH">Hoàn thành</option>
              <option value="TỪ CHỐI">Từ chối</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Đặt lại
            </Button>
          </div>
        </div>
        <div className="w-full rounded-lg space-y-4  flex flex-col">
          <DataTable
            columns={refundColumn({
              onView: ({ id }) => {
                setSelectedID(id);
                setIsDetailModalOpen(true);
              },
                onUpdateStatus: (request) => {
                  setSelectedID(request._id);
                  setIsUpdateModalOpen(true);
                  setSelectedRequest(request);
                },
            })} 
            data={response || []}
          />
          <PaginationDemo
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
            currentPage={pagination?.currentPage ?? 1}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Hiển thị {response?.length} / {response?.length} yêu cầu
        </p>
      </div>

      {isDetailModalOpen && selectedID && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          {isDetailLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="bg-card border border-border shadow-lg rounded-xl w-full max-w-md p-6 relative animate-in fade-in-50 slide-in-from-bottom-5">
              <h2 className="text-lg md:text-xl font-semibold text-foreground mb-5 flex items-center justify-between">
                Chi tiết yêu cầu hoàn tiền
              </h2>
              <div className="space-y-4 text-sm">
                <InfoRow
                  label="Người dùng"
                  value={detailResponse?.user_info.fullname ?? "—"}
                />
                <InfoRow
                  label="Email"
                  value={detailResponse?.user_info.email ?? "—"}
                />
                <InfoRow
                  label="Mã đơn thuê"
                  value={detailResponse?.transaction_id ?? "—"}
                  mono
                />
                <InfoRow
                  label="Số tiền"
                  value={`${Number(detailResponse?.amount?.$numberDecimal ?? 0).toLocaleString()} đ`}
                  highlight
                />
                <div>
                  <p className="text-xs text-muted-foreground">Trạng thái</p>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium mt-2 ${getStatusColor(
                      detailResponse?.status ?? "ĐANG CHỜ XỬ LÝ"
                    )}`}
                  >
                    {getStatusIcon(detailResponse?.status ?? "ĐANG CHỜ XỬ LÝ")}
                    {getStatusLabel(detailResponse?.status ?? "ĐANG CHỜ XỬ LÝ")}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {isUpdateModalOpen && selectedID && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {isDetailLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Cập nhật trạng thái
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Người dùng: {detailResponse?.user_info.fullname || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Số tiền:{" "}
                    {Number(
                      detailResponse?.amount?.$numberDecimal ?? 0
                    ).toLocaleString("vi-VN")}{" "}
                    đ
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Trạng thái mới
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as RefundStatus)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    {nextStatuses.length > 0 ? (
                      nextStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))
                    ) : (
                      <option value="">Không có trạng thái khả dụng</option>
                    )}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsUpdateModalOpen(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button onClick={() => handleSaveStatus()} className="flex-1">
                    Lưu 
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
