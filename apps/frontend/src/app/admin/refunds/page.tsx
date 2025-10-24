"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import type { RefundRequest, RefundStatus } from "@custom-types";
import type { DetailUser } from "@/services/auth.service";
import { Download, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { useRefundAction } from "@/hooks/useRefundAction";
import { refundColumn } from "@/columns/refund-column";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { DataTable } from "@/components/TableCustom";
import { set } from "zod";
export const getStatusColor = (status: RefundStatus) => {
  switch (status) {
    case "ĐANG CHỜ XỬ LÝ":
      return "bg-yellow-100 text-yellow-800";
    case "ĐÃ DUYỆT":
      return "bg-blue-100 text-blue-800";
    case "TỪ CHỐI":
      return "bg-red-100 text-red-800";
    case "ĐÃ HOÀN TIỀN":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: RefundStatus) => {
  switch (status) {
    case "ĐANG CHỜ XỬ LÝ":
      return <Clock className="w-4 h-4" />;
    case "ĐÃ DUYỆT":
      return <CheckCircle className="w-4 h-4" />;
    case "ĐÃ HOÀN TIỀN":
      return <CheckCircle className="w-4 h-4" />;
    case "TỪ CHỐI":
      return <XCircle className="w-4 h-4" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: RefundStatus) => {
  switch (status) {
    case "ĐANG CHỜ XỬ LÝ":
      return "Chờ xử lý";
    case "ĐÃ DUYỆT":
      return "Đã duyệt";
    case "ĐÃ HOÀN TIỀN":
      return "Hoàn thành";
    case "TỪ CHỐI":
      return "Từ chối";
    default:
      return status;
  }
};

export default function RefundPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RefundStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(
    null
  );
  const [selectedID, setSelectedID] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const {
    response,
    isLoading,
    isError,
    refetch,
    pagination,
    getAllRefundRequest,
    detailResponse,
    isDetailLoading,
    getDetailRefundRequest,
  } = useRefundAction({
    hasToken: true,
    page: page,
    limit: limit,
    id: selectedID || "",
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RefundStatus>("ĐANG CHỜ XỬ LÝ");
  const [adminNote, setAdminNote] = useState("");
  useEffect(() => {
    getAllRefundRequest();
  }, [page, limit, statusFilter, searchQuery, refetch]);
  const handleViewDetails = (request: RefundRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  // const handleUpdateStatus = (request: RefundRequest) => {
  //   setSelectedRequest(request);
  //   setNewStatus(request.status);
  //   // setAdminNote(request.admin_note || "");
  //   setIsUpdateModalOpen(true);
  // };

  const handleSaveStatus = () => {
    console.log(
      "[v0] Updating refund status:",
      selectedRequest?._id,
      newStatus,
      adminNote
    );
    setIsUpdateModalOpen(false);
    setSelectedRequest(null);
  };

  // const totalAmount = mockRefundRequests.reduce(
  //   (sum, req) => sum + req.amount,
  //   0
  // );
  // const pendingAmount = mockRefundRequests
  //   .filter((req) => req.status === "ĐANG CHỜ XỬ LÝ")
  //   .reduce((sum, req) => sum + req.amount, 0);
  useEffect(() => {
    getAllRefundRequest();
    console.log(detailResponse)
  }, [selectedID]);
  useEffect(() => {
    console.log(detailResponse);
  }, [detailResponse]);
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
            {/* <p className="text-2xl font-bold text-foreground mt-1">
              {mockRefundRequests.length}
            </p> */}
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Chờ xử lý</p>
            {/* <p className="text-2xl font-bold text-yellow-500 mt-1">
              {
                mockRefundRequests.filter((r) => r.status === "ĐANG CHỜ XỬ LÝ")
                  .length
              }
            </p> */}
          </div>
          {/* <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng tiền chờ xử lý</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {pendingAmount.toLocaleString("vi-VN")} đ
            </p>
          </div> */}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc mã đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as RefundStatus | "all")
              }
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="APPROVED">Đã phê duyệt</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="REJECTED">Từ chối</option>
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
            })}
            data={response || []}
          />
          <PaginationDemo
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setPage}
            currentPage={pagination?.currentPage ?? 1}
          />
        </div>

        {/* Results info */}
        <p className="text-sm text-muted-foreground">
          Hiển thị {response?.length} / {response?.length} yêu cầu
        </p>
      </div>

      {isDetailModalOpen && selectedID && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {isDetailLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Chi tiết yêu cầu hoàn tiền
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Người dùng</p>
                  <p className="text-foreground font-medium">
                    {detailResponse?._id}
                  </p>
                </div>
                {/* <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground font-medium">
                    {detailResponse?.user_email}
                  </p>
                </div> */}
                <div>
                  <p className="text-sm text-muted-foreground">Mã đơn thuê</p>
                  <p className="text-foreground font-mono">
                    {detailResponse?._id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số tiền</p>
                  <p className="text-foreground font-bold text-lg">
                    {detailResponse?.amount.$numberDecimal.toLocaleString(
                      "vi-VN"
                    )}{" "}
                    đ
                  </p>
                </div>
                {/* <div>
                  <p className="text-sm text-muted-foreground">Lý do</p>
                  <p className="text-foreground font-medium">
                    {detailResponse?.reason}
                  </p>
                </div> */}
                {/* {selectedRequest?.admin_note && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ghi chú admin</p>
                    <p className="text-foreground font-medium">
                      {selectedRequest.admin_note}
                    </p>
                  </div>
                )} */}
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(detailResponse?.status ?? "ĐANG CHỜ XỬ LÝ")}`}
                  >
                    {getStatusIcon(detailResponse?.status ?? "ĐANG CHỜ XỬ LÝ")}
                    {getStatusLabel(detailResponse?.status ?? "ĐANG CHỜ XỬ LÝ")}
                  </span>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="flex-1"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* {isUpdateModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Cập nhật trạng thái
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Người dùng: {selectedRequest.user_name}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Số tiền: {selectedRequest.amount.toLocaleString("vi-VN")} đ
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Trạng thái mới
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as RefundStatus)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="APPROVED">Đã phê duyệt</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Nhập ghi chú..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button onClick={handleSaveStatus} className="flex-1">
                  Lưu
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}  */}
    </div>
  );
}
