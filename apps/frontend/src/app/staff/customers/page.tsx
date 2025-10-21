"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CustomerCard } from "@/components/customers/customer-card";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomerStats } from "@/components/customers/customer-stats";
import { Button } from "@/components/ui/button";
import type { Customer, CustomerStatus, CustomerType } from "@/types/customer";
import type { DetailUser } from "@/types/user";
import { Plus, Download } from "lucide-react";

// Mock data
const mockCustomers: Customer[] = [
  {
    _id: "c1",
    customer_code: "KH-2024-001",
    full_name: "Nguyễn Văn An",
    email: "nguyenvanan@email.com",
    phone_number: "0901234567",
    address: "123 Nguyễn Huệ",
    city: "Hồ Chí Minh",
    id_number: "079123456789",
    customer_type: "individual",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 15,
    total_spent: 4500000,
    current_rentals: 1,
    rating: 4.8,
    registered_date: "2024-01-15T00:00:00Z",
    last_rental_date: "2024-06-10T00:00:00Z",
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-06-10T00:00:00Z",
  },
  {
    _id: "c2",
    customer_code: "KH-2024-002",
    full_name: "Lê Thị Mai",
    email: "lethimai@email.com",
    phone_number: "0912345678",
    address: "456 Lê Lợi",
    city: "Hà Nội",
    id_number: "001234567890",
    customer_type: "individual",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 23,
    total_spent: 6800000,
    current_rentals: 0,
    rating: 4.9,
    registered_date: "2024-01-10T00:00:00Z",
    last_rental_date: "2024-06-09T00:00:00Z",
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-06-09T00:00:00Z",
  },
  {
    _id: "c3",
    customer_code: "KH-2024-003",
    full_name: "Phạm Minh Tuấn",
    email: "phamminhtuan@email.com",
    phone_number: "0923456789",
    address: "789 Trần Hưng Đạo",
    city: "Đà Nẵng",
    id_number: "048123456789",
    customer_type: "individual",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 8,
    total_spent: 2400000,
    current_rentals: 1,
    rating: 4.5,
    registered_date: "2024-02-20T00:00:00Z",
    last_rental_date: "2024-06-10T00:00:00Z",
    created_at: "2024-02-20T00:00:00Z",
    updated_at: "2024-06-10T00:00:00Z",
  },
  {
    _id: "c4",
    customer_code: "KH-2024-004",
    full_name: "Võ Thị Hương",
    email: "vothihuong@email.com",
    phone_number: "0934567890",
    address: "321 Hai Bà Trưng",
    city: "Hồ Chí Minh",
    id_number: "079987654321",
    customer_type: "individual",
    status: "inactive",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 3,
    total_spent: 900000,
    current_rentals: 0,
    rating: 4.2,
    registered_date: "2024-03-05T00:00:00Z",
    last_rental_date: "2024-04-15T00:00:00Z",
    created_at: "2024-03-05T00:00:00Z",
    updated_at: "2024-04-15T00:00:00Z",
  },
  {
    _id: "c5",
    customer_code: "KH-2024-005",
    full_name: "Công ty TNHH ABC",
    email: "contact@abc.com",
    phone_number: "0945678901",
    address: "555 Võ Văn Tần",
    city: "Hồ Chí Minh",
    id_number: "0123456789",
    customer_type: "corporate",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 45,
    total_spent: 18500000,
    current_rentals: 3,
    rating: 4.9,
    notes: "Khách hàng doanh nghiệp VIP",
    registered_date: "2023-12-01T00:00:00Z",
    last_rental_date: "2024-06-08T00:00:00Z",
    created_at: "2023-12-01T00:00:00Z",
    updated_at: "2024-06-08T00:00:00Z",
  },
  {
    _id: "c6",
    customer_code: "KH-2024-006",
    full_name: "Đặng Quốc Bảo",
    email: "dangquocbao@email.com",
    phone_number: "0956789012",
    address: "888 Nguyễn Thị Minh Khai",
    city: "Cần Thơ",
    id_number: "092123456789",
    customer_type: "individual",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 12,
    total_spent: 3600000,
    current_rentals: 0,
    rating: 4.7,
    registered_date: "2024-02-10T00:00:00Z",
    last_rental_date: "2024-06-07T00:00:00Z",
    created_at: "2024-02-10T00:00:00Z",
    updated_at: "2024-06-07T00:00:00Z",
  },
  {
    _id: "c7",
    customer_code: "KH-2024-007",
    full_name: "Bùi Thị Lan",
    email: "buithilan@email.com",
    phone_number: "0967890123",
    address: "222 Lý Thường Kiệt",
    city: "Nha Trang",
    id_number: "058123456789",
    customer_type: "individual",
    status: "blocked",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 2,
    total_spent: 400000,
    current_rentals: 0,
    rating: 2.5,
    notes: "Vi phạm quy định thuê xe nhiều lần",
    registered_date: "2024-04-01T00:00:00Z",
    last_rental_date: "2024-05-10T00:00:00Z",
    created_at: "2024-04-01T00:00:00Z",
    updated_at: "2024-05-10T00:00:00Z",
  },
  {
    _id: "c8",
    customer_code: "KH-2024-008",
    full_name: "Trương Văn Đức",
    email: "truongvanduc@email.com",
    phone_number: "0978901234",
    address: "999 Điện Biên Phủ",
    city: "Hồ Chí Minh",
    id_number: "079111222333",
    customer_type: "individual",
    status: "active",
    avatar: "/placeholder.svg?height=100&width=100",
    total_rentals: 28,
    total_spent: 8400000,
    current_rentals: 2,
    rating: 4.8,
    registered_date: "2024-01-05T00:00:00Z",
    last_rental_date: "2024-06-09T00:00:00Z",
    created_at: "2024-01-05T00:00:00Z",
    updated_at: "2024-06-09T00:00:00Z",
  },
];

// Mock user for DashboardLayout
const mockUser: DetailUser = {
  _id: "507f1f77bcf86cd799439011",
  fullName: "Nguyễn Văn Minh",
  email: "minh.nguyen@bikerental.vn",
  verify: "verified",
  location: "Hà Nội, Việt Nam",
  username: "minh_staff",
  phone_number: "+84 912 345 678",
  avatar: "/professional-avatar.png",
  role: "admin",
  created_at: "2024-01-15T08:30:00Z",
  updated_at: "2025-01-06T10:20:00Z",
};

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<CustomerType | "all">("all");
  const [cityFilter, setCityFilter] = useState("all");

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone_number.includes(searchQuery) ||
      customer.customer_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || customer.status === statusFilter;
    const matchesType =
      typeFilter === "all" || customer.customer_type === typeFilter;
    const matchesCity = cityFilter === "all" || customer.city === cityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesCity;
  });

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setCityFilter("all");
  };

  const stats = {
    total: mockCustomers.length,
    active: mockCustomers.filter((c) => c.status === "active").length,
    inactive: mockCustomers.filter((c) => c.status === "inactive").length,
    blocked: mockCustomers.filter((c) => c.status === "blocked").length,
    newThisMonth: mockCustomers.filter((c) => {
      const registeredDate = new Date(c.registered_date);
      const now = new Date();
      return (
        registeredDate.getMonth() === now.getMonth() &&
        registeredDate.getFullYear() === now.getFullYear()
      );
    }).length,
    totalRevenue: mockCustomers.reduce((sum, c) => sum + c.total_spent, 0),
    averageSpent: Math.round(
      mockCustomers.reduce((sum, c) => sum + c.total_spent, 0) /
        mockCustomers.length
    ),
    topCustomers: mockCustomers.filter((c) => c.total_spent > 5000000).length,
  };

  return (
    <DashboardLayout user={mockUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý khách hàng
            </h1>
            <p className="text-muted-foreground mt-1">
              Theo dõi và quản lý thông tin khách hàng
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm khách hàng
            </Button>
          </div>
        </div>

        {/* Stats */}
        <CustomerStats stats={stats} />

        {/* Filters */}
        <CustomerFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          cityFilter={cityFilter}
          onCityChange={setCityFilter}
          onReset={handleReset}
        />

        {/* Results */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị {filteredCustomers.length} / {mockCustomers.length} khách
            hàng
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer._id}
                customer={customer}
                onView={(customer) =>
                  console.log("[v0] View customer:", customer._id)
                }
                onEdit={(customer) =>
                  console.log("[v0] Edit customer:", customer._id)
                }
                onBlock={(customer) =>
                  console.log("[v0] Block customer:", customer._id)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
