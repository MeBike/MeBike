"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import type { RefundRequest, RefundStatus } from "@custom-types";
import type { DetailUser } from "@/services/auth.service";
import { Download, Eye, CheckCircle, XCircle, Clock } from "lucide-react";

const mockRefundRequests: RefundRequest[] = [
  {
    _id: "68f47fdd11682ab6726fb566",
    user_id: "507f1f77bcf86cd799439011",
    user_name: "Nguyễn Văn A",
    user_email: "nguyenvana@example.com",
    rental_id: "RENTAL001",
    amount: 50000,
    reason: "Xe bị hỏng trong quá trình sử dụng",
    status: "PENDING",
    created_at: "2025-10-20T10:30:00Z",
    updated_at: "2025-10-20T10:30:00Z",
  },
  {
    _id: "68f47fdd11682ab6726fb567",
    user_id: "507f1f77bcf86cd799439012",
    user_name: "Trần Thị B",
    user_email: "tranthib@example.com",
    rental_id: "RENTAL002",
    amount: 100000,
    reason: "Không thể sử dụng dịch vụ",
    status: "APPROVED",
    admin_note: "Đã kiểm tra, phê duyệt hoàn tiền",
    created_at: "2025-10-19T14:20:00Z",
    updated_at: "2025-10-20T09:15:00Z",
  },
  {
    _id: "68f47fdd11682ab6726fb568",
    user_id: "507f1f77bcf86cd799439013",
    user_name: "Lê Văn C",
    user_email: "levanc@example.com",
    rental_id: "RENTAL003",
    amount: 75000,
    reason: "Yêu cầu hủy đơn",
    status: "COMPLETED",
    admin_note: "Hoàn tiền thành công",
    created_at: "2025-10-18T08:45:00Z",
    updated_at: "2025-10-20T11:00:00Z",
  },
];

const getStatusColor = (status: RefundStatus) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "APPROVED":
      return "bg-blue-100 text-blue-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: RefundStatus) => {
  switch (status) {
    case "PENDING":
      return <Clock className="w-4 h-4" />;
    case "APPROVED":
      return <CheckCircle className="w-4 h-4" />;
    case "COMPLETED":
      return <CheckCircle className="w-4 h-4" />;
    case "REJECTED":
      return <XCircle className="w-4 h-4" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: RefundStatus) => {
  switch (status) {
    case "PENDING":
      return "Chờ xử lý";
    case "APPROVED":
      return "Đã phê duyệt";
    case "COMPLETED":
      return "Hoàn thành";
    case "REJECTED":
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<RefundStatus>("PENDING");
  const [adminNote, setAdminNote] = useState("");

  const filteredRequests = mockRefundRequests.filter((request) => {
    const matchesSearch =
      request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.rental_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (request: RefundRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatus = (request: RefundRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setAdminNote(request.admin_note || "");
    setIsUpdateModalOpen(true);
  };

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

  const totalAmount = mockRefundRequests.reduce(
    (sum, req) => sum + req.amount,
    0
  );
  const pendingAmount = mockRefundRequests
    .filter((req) => req.status === "PENDING")
    .reduce((sum, req) => sum + req.amount, 0);

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
              {mockRefundRequests.length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Chờ xử lý</p>
            <p className="text-2xl font-bold text-yellow-500 mt-1">
              {mockRefundRequests.filter((r) => r.status === "PENDING").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng tiền chờ xử lý</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {pendingAmount.toLocaleString("vi-VN")} đ
            </p>
          </div>
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

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Lý do
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRequests.map((request) => (
                <tr
                  key={request._id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    <div>
                      <p>{request.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.user_email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-mono">
                    {request.rental_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-semibold">
                    {request.amount.toLocaleString("vi-VN")} đ
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {request.reason}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                    >
                      {getStatusIcon(request.status)}
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Chi tiết
                      </Button>
                      {request.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(request)}
                        >
                          Xử lý
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Results info */}
        <p className="text-sm text-muted-foreground">
          Hiển thị {filteredRequests.length} / {mockRefundRequests.length} yêu
          cầu
        </p>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Chi tiết yêu cầu hoàn tiền
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Người dùng</p>
                <p className="text-foreground font-medium">
                  {selectedRequest.user_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground font-medium">
                  {selectedRequest.user_email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mã đơn thuê</p>
                <p className="text-foreground font-mono">
                  {selectedRequest.rental_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số tiền</p>
                <p className="text-foreground font-bold text-lg">
                  {selectedRequest.amount.toLocaleString("vi-VN")} đ
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lý do</p>
                <p className="text-foreground font-medium">
                  {selectedRequest.reason}
                </p>
              </div>
              {selectedRequest.admin_note && (
                <div>
                  <p className="text-sm text-muted-foreground">Ghi chú admin</p>
                  <p className="text-foreground font-medium">
                    {selectedRequest.admin_note}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedRequest.status)}`}
                >
                  {getStatusIcon(selectedRequest.status)}
                  {getStatusLabel(selectedRequest.status)}
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
        </div>
      )}

      {/* Update Status Modal */}
      {isUpdateModalOpen && selectedRequest && (
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
      )}
    </div>
  );
}
