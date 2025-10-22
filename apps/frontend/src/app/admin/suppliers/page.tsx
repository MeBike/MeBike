"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import type { Supplier, StatsSupplierBike } from "@custom-types";
import { DetailUser } from "@/services/authService";
import { Plus, Download, Edit2, Trash2, Eye, X } from "lucide-react";

// Mock data
const mockSuppliers: Supplier[] = [
  {
    _id: "supplier_001",
    name: "Giant Vietnam",
    contact_info: {
      address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
      phone_number: "0912345678",
    },
    contract_fee: "5000000",
    status: "HOẠT ĐỘNG",
    created_at: "2024-01-15T00:00:00Z",
  },
  {
    _id: "supplier_002",
    name: "Trek Bikes Vietnam",
    contact_info: {
      address: "456 Đường Nguyễn Huệ, Quận 1, TP.HCM",
      phone_number: "0912345679",
    },
    contract_fee: "4500000",
    status: "HOẠT ĐỘNG",
    created_at: "2024-01-16T00:00:00Z",
  },
  {
    _id: "supplier_003",
    name: "Specialized Vietnam",
    contact_info: {
      address: "789 Đường Đồng Khởi, Quận 1, TP.HCM",
      phone_number: "0912345680",
    },
    contract_fee: "6000000",
    status: "NGƯNG HOẠT ĐỘNG",
    created_at: "2024-01-17T00:00:00Z",
  },
];

const mockStats: StatsSupplierBike[] = [
  {
    supplier_id: "supplier_001",
    supplier_name: "Giant Vietnam",
    total_bikes: 150,
    active_bikes: 120,
    booked_bikes: 20,
    broken_bikes: 5,
    maintain_bikes: 3,
    unavailable_bikes: 2,
  },
  {
    supplier_id: "supplier_002",
    supplier_name: "Trek Bikes Vietnam",
    total_bikes: 100,
    active_bikes: 85,
    booked_bikes: 10,
    broken_bikes: 3,
    maintain_bikes: 2,
    unavailable_bikes: 0,
  },
  {
    supplier_id: "supplier_003",
    supplier_name: "Specialized Vietnam",
    total_bikes: 80,
    active_bikes: 60,
    booked_bikes: 15,
    broken_bikes: 3,
    maintain_bikes: 2,
    unavailable_bikes: 0,
  },
];

const mockUser: DetailUser = {
  _id: "507f1f77bcf86cd799439011",
  fullname: "Nguyễn Văn Minh",
  email: "minh.nguyen@bikerental.vn",
  verify: "verified",
  location: "Hà Nội, Việt Nam",
  username: "minh_staff",
  phone_number: "+84 912 345 678",
  avatar: "/professional-avatar.png",
  role: "ADMIN",
  created_at: "2024-01-15T08:30:00Z",
  updated_at: "2025-01-06T10:20:00Z",
};

const getStatusColor = (status: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG") => {
  return status === "HOẠT ĐỘNG"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
};

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG" | "all"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone_number: "",
    contract_fee: "",
    status: "HOẠT ĐỘNG" as "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG",
  });

  const filteredSuppliers = mockSuppliers.filter((supplier) => {
    const matchesSearch = supplier.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || supplier.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAddSupplier = () => {
    console.log("[v0] Adding supplier:", formData);
    setFormData({
      name: "",
      address: "",
      phone_number: "",
      contract_fee: "",
      status: "HOẠT ĐỘNG",
    });
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout user={mockUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý nhà cung cấp
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách nhà cung cấp xe đạp
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm nhà cung cấp
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng nhà cung cấp</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {mockSuppliers.length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-500 mt-1">
              {mockSuppliers.filter((s) => s.status === "HOẠT ĐỘNG").length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng xe đạp</p>
            <p className="text-2xl font-bold text-blue-500 mt-1">
              {mockStats.reduce((sum, stat) => sum + stat.total_bikes, 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên nhà cung cấp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG" | "all"
                )
              }
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="HOẠT ĐỘNG">Hoạt động</option>
              <option value="NGƯNG HOẠT ĐỘNG">Ngưng hoạt động</option>
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
                  Tên nhà cung cấp
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Địa chỉ
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Số điện thoại
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Phí hợp đồng
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
              {filteredSuppliers.map((supplier) => (
                <tr
                  key={supplier._id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    {supplier.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {supplier.contact_info.address}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {supplier.contact_info.phone_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {supplier.contract_fee} VND
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(supplier.status)}`}
                    >
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stats by Supplier */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            Thống kê xe đạp theo nhà cung cấp
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockStats.map((stat) => (
              <div
                key={stat.supplier_id}
                className="bg-card border border-border rounded-lg p-4"
              >
                <h3 className="font-semibold text-foreground mb-3">
                  {stat.supplier_name}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng xe:</span>
                    <span className="font-medium text-foreground">
                      {stat.total_bikes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Có sẵn:</span>
                    <span className="font-medium text-green-600">
                      {stat.active_bikes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đang thuê:</span>
                    <span className="font-medium text-blue-600">
                      {stat.booked_bikes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bị hỏng:</span>
                    <span className="font-medium text-red-600">
                      {stat.broken_bikes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bảo trì:</span>
                    <span className="font-medium text-orange-600">
                      {stat.maintain_bikes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Không có sẵn:</span>
                    <span className="font-medium text-gray-600">
                      {stat.unavailable_bikes}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results info */}
        <p className="text-sm text-muted-foreground">
          Hiển thị {filteredSuppliers.length} / {mockSuppliers.length} nhà cung
          cấp
        </p>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Thêm nhà cung cấp mới
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tên nhà cung cấp
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Nhập tên nhà cung cấp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phí hợp đồng
                </label>
                <input
                  type="text"
                  value={formData.contract_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_fee: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Nhập phí hợp đồng"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG",
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="HOẠT ĐỘNG">Hoạt động</option>
                  <option value="NGƯNG HOẠT ĐỘNG">Ngưng hoạt động</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button onClick={handleAddSupplier} className="flex-1">
                  Thêm nhà cung cấp
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
