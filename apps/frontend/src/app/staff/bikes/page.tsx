
"use client";

import { useState } from "react";
import { DashboardLayout } from "@components/dashboard/dashboard-layout";
import { BikeCard } from "@components/bikes/bike-card";
import { BikeFilters } from "@components/bikes/bike-filter"
import { Button } from "@components/ui/button";
import type { Bike, BikeStatus, BikeType } from "@custom-types";
import type { User as DetailUser } from "@custom-types";
import { Plus, Download } from "lucide-react";

// Mock data
const mockBikes: Bike[] = [
  {
    _id: "1",
    name: "Giant Talon 3",
    type: "mountain",
    brand: "Giant",
    model: "Talon 3 2024",
    status: "available",
    price_per_hour: 50000,
    price_per_day: 300000,
    image: "/mountain-bike-trail.png",
    description: "Xe đạp địa hình chất lượng cao, phù hợp mọi địa hình",
    features: ["Phanh đĩa thủy lực", "Khung nhôm", "27 tốc độ"],
    location: "Chi nhánh Quận 1",
    total_rentals: 45,
    rating: 4.8,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  {
    _id: "2",
    name: "Trek FX 3",
    type: "hybrid",
    brand: "Trek",
    model: "FX 3 Disc",
    status: "rented",
    price_per_hour: 45000,
    price_per_day: 250000,
    image: "/hybrid-bike.jpg",
    description: "Xe đạp hybrid đa năng, phù hợp đi phố và đường trường",
    features: ["Phanh đĩa", "Khung carbon", "21 tốc độ"],
    location: "Chi nhánh Quận 3",
    total_rentals: 67,
    rating: 4.9,
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z",
  },
  {
    _id: "3",
    name: "VinFast Klara S",
    type: "electric",
    brand: "VinFast",
    model: "Klara S 2024",
    status: "available",
    price_per_hour: 80000,
    price_per_day: 500000,
    image: "/electric-bike.png",
    description: "Xe đạp điện hiện đại, tiết kiệm năng lượng",
    features: ["Pin lithium", "Tốc độ tối đa 50km/h", "Màn hình LCD"],
    location: "Chi nhánh Quận 7",
    total_rentals: 89,
    rating: 4.7,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
  {
    _id: "4",
    name: "Specialized Sirrus",
    type: "city",
    brand: "Specialized",
    model: "Sirrus 2.0",
    status: "maintenance",
    price_per_hour: 40000,
    price_per_day: 220000,
    image: "/classic-city-bike.png",
    description: "Xe đạp thành phố thoải mái, dễ điều khiển",
    features: ["Yên êm ái", "Giỏ xe", "Đèn LED"],
    location: "Chi nhánh Quận 5",
    total_rentals: 34,
    rating: 4.5,
    created_at: "2024-01-20T00:00:00Z",
    updated_at: "2024-01-20T00:00:00Z",
  },
  {
    _id: "5",
    name: "Cannondale CAAD13",
    type: "road",
    brand: "Cannondale",
    model: "CAAD13 105",
    status: "available",
    price_per_hour: 70000,
    price_per_day: 400000,
    image: "/sleek-red-road-bike.png",
    description: "Xe đạp đường trường tốc độ cao, nhẹ và bền",
    features: ["Khung carbon", "Shimano 105", "Bánh xe 700c"],
    location: "Chi nhánh Quận 2",
    total_rentals: 56,
    rating: 4.9,
    created_at: "2024-01-25T00:00:00Z",
    updated_at: "2024-01-25T00:00:00Z",
  },
  {
    _id: "6",
    name: "Merida Big Nine",
    type: "mountain",
    brand: "Merida",
    model: "Big Nine 100",
    status: "available",
    price_per_hour: 55000,
    price_per_day: 320000,
    image: "/mountain-bike-merida.jpg",
    description: "Xe đạp địa hình bánh lớn 29 inch",
    features: ["Phanh đĩa", "Khung nhôm", "24 tốc độ"],
    location: "Chi nhánh Quận 1",
    total_rentals: 41,
    rating: 4.6,
    created_at: "2024-02-05T00:00:00Z",
    updated_at: "2024-02-05T00:00:00Z",
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
  password: "",
  email_verify_token: "",
  forgot_verify_token: "",
};

export default function BikesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<BikeType | "all">("all");

  const filteredBikes = mockBikes.filter((bike) => {
    const matchesSearch =
      bike.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bike.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || bike.status === statusFilter;
    const matchesType = typeFilter === "all" || bike.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const stats = {
    total: mockBikes.length,
    available: mockBikes.filter((b) => b.status === "available").length,
    rented: mockBikes.filter((b) => b.status === "rented").length,
    maintenance: mockBikes.filter((b) => b.status === "maintenance").length,
  };

  return (
    <DashboardLayout user={mockUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý xe đạp
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách xe đạp và trạng thái cho thuê
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm xe mới
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng số xe</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {stats.total}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Sẵn sàng</p>
            <p className="text-2xl font-bold text-green-500 mt-1">
              {stats.available}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Đang thuê</p>
            <p className="text-2xl font-bold text-blue-500 mt-1">
              {stats.rented}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Bảo trì</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">
              {stats.maintenance}
            </p>
          </div>
        </div>

        {/* Filters */}
        <BikeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          onReset={handleReset}
        />

        {/* Results */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị {filteredBikes.length} / {mockBikes.length} xe đạp
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBikes.map((bike) => (
              <BikeCard
                key={bike._id}
                bike={bike}
                onView={(bike) => console.log("[v0] View bike:", bike._id)}
                onEdit={(bike) => console.log("[v0] Edit bike:", bike._id)}
                onDelete={(bike) => console.log("[v0] Delete bike:", bike._id)}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
