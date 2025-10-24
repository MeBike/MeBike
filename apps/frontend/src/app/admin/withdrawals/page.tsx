"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import type { WithdrawRequest, WithdrawStatus } from "@custom-types";
import type { DetailUser } from "@/services/auth.service";
import { Download, Eye, CheckCircle, XCircle, Clock } from "lucide-react";

const mockWithdrawRequests: WithdrawRequest[] = [
  {
    _id: "68f47fdd11682ab6726fb563",
    user_id: "507f1f77bcf86cd799439011",
    user_name: "Nguyễn Văn A",
    user_email: "nguyenvana@example.com",
    amount: 500000,
    bank_account: "1234567890",
    bank_name: "Vietcombank",
    account_holder: "Nguyễn Văn A",
    status: "PENDING",
    created_at: "2025-10-20T10:30:00Z",
    updated_at: "2025-10-20T10:30:00Z",
  },
  {
    _id: "68f47fdd11682ab6726fb564",
    user_id: "507f1f77bcf86cd799439012",
    user_name: "Trần Thị B",
    user_email: "tranthib@example.com",
    amount: 1000000,
    bank_account: "0987654321",
    bank_name: "Techcombank",
    account_holder: "Trần Thị B",
    status: "APPROVED",
    created_at: "2025-10-19T14:20:00Z",
    updated_at: "2025-10-20T09:15:00Z",
  },
  {
    _id: "68f47fdd11682ab6726fb565",
    user_id: "507f1f77bcf86cd799439013",
    user_name: "Lê Văn C",
    user_email: "levanc@example.com",
    amount: 750000,
    bank_account: "1122334455",
    bank_name: "BIDV",
    account_holder: "Lê Văn C",
    status: "COMPLETED",
    created_at: "2025-10-18T08:45:00Z",
    updated_at: "2025-10-20T11:00:00Z",
  },
];


const getStatusColor = (status: WithdrawStatus) => {
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

const getStatusIcon = (status: WithdrawStatus) => {
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

const getStatusLabel = (status: WithdrawStatus) => {
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

export default function WithdrawPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WithdrawStatus | "all">(
    "all"
  );
  const [selectedRequest, setSelectedRequest] =
    useState<WithdrawRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<WithdrawStatus>("PENDING");

  const filteredRequests = mockWithdrawRequests.filter((request) => {
    const matchesSearch =
      request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (request: WithdrawRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatus = (request: WithdrawRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setIsUpdateModalOpen(true);
  };

  const handleSaveStatus = () => {
    console.log(
      "[v0] Updating withdraw status:",
      selectedRequest?._id,
      newStatus
    );
    setIsUpdateModalOpen(false);
    setSelectedRequest(null);
  };

  const totalAmount = mockWithdrawRequests.reduce(
    (sum, req) => sum + req.amount,
    0
  );
  const pendingAmount = mockWithdrawRequests
    .filter((req) => req.status === "PENDING")
    .reduce((sum, req) => sum + req.amount, 0);
  const completedAmount = mockWithdrawRequests
    .filter((req) => req.status === "COMPLETED")
    .reduce((sum, req) => sum + req.amount, 0);

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý rút tiền
            </h1>
            <p className="text-muted-foreground mt-1">
              Xem và xử lý các yêu cầu rút tiền từ người dùng
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
              {mockWithdrawRequests.length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Chờ xử lý</p>
            <p className="text-2xl font-bold text-yellow-500 mt-1">
              {
                mockWithdrawRequests.filter((r) => r.status === "PENDING")
                  .length
              }
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
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as WithdrawStatus | "all")
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
                  Số tiền
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Ngân hàng
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Ngày tạo
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
                  <td className="px-6 py-4 text-sm text-foreground font-semibold">
                    {request.amount.toLocaleString("vi-VN")} đ
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {request.bank_name}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                    >
                      {getStatusIcon(request.status)}
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString("vi-VN")}
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
          Hiển thị {filteredRequests.length} / {mockWithdrawRequests.length} yêu
          cầu
        </p>
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Chi tiết yêu cầu rút tiền
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
                <p className="text-sm text-muted-foreground">Số tiền</p>
                <p className="text-foreground font-bold text-lg">
                  {selectedRequest.amount.toLocaleString("vi-VN")} đ
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngân hàng</p>
                <p className="text-foreground font-medium">
                  {selectedRequest.bank_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chủ tài khoản</p>
                <p className="text-foreground font-medium">
                  {selectedRequest.account_holder}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số tài khoản</p>
                <p className="text-foreground font-medium">
                  {selectedRequest.bank_account}
                </p>
              </div>
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
                  onChange={(e) =>
                    setNewStatus(e.target.value as WithdrawStatus)
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="APPROVED">Đã phê duyệt</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="REJECTED">Từ chối</option>
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
