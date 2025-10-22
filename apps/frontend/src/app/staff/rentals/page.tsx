"use client";

import { useState } from "react";
import { RentalTable } from "@/components/rentals/rental-table";
import { RentalFilters } from "@/components/rentals/rental-filters";
import { RentalStats } from "@/components/rentals/rental-stats";
import { Button } from "@/components/ui/button";
import type { Rental, RentalStatus, PaymentStatus } from "@custom-types";
import type { User as DetailUser } from "@custom-types";
import { Plus, Download } from "lucide-react";
const mockRentals: Rental[] = [
  {
    _id: "1",
    rental_code: "RNT-2024-001",
    customer_id: "c1",
    customer_name: "Nguyễn Văn An",
    customer_phone: "0901234567",
    customer_email: "nguyenvanan@email.com",
    bike_id: "1",
    bike_name: "Giant Talon 3",
    bike_type: "Xe đạp địa hình",
    start_date: "2024-06-10T08:00:00Z",
    end_date: "2024-06-10T18:00:00Z",
    rental_hours: 10,
    rental_days: 0,
    price_per_hour: 50000,
    price_per_day: 300000,
    total_amount: 500000,
    deposit_amount: 200000,
    payment_status: "paid",
    payment_method: "card",
    status: "active",
    staff_id: "s1",
    staff_name: "Trần Thị Bình",
    created_at: "2024-06-10T07:30:00Z",
    updated_at: "2024-06-10T07:30:00Z",
  },
  {
    _id: "2",
    rental_code: "RNT-2024-002",
    customer_id: "c2",
    customer_name: "Lê Thị Mai",
    customer_phone: "0912345678",
    customer_email: "lethimai@email.com",
    bike_id: "2",
    bike_name: "Trek FX 3",
    bike_type: "Xe đạp hybrid",
    start_date: "2024-06-09T09:00:00Z",
    end_date: "2024-06-11T09:00:00Z",
    actual_return_date: "2024-06-11T08:30:00Z",
    rental_hours: 0,
    rental_days: 2,
    price_per_hour: 45000,
    price_per_day: 250000,
    total_amount: 500000,
    deposit_amount: 150000,
    payment_status: "paid",
    payment_method: "momo",
    status: "completed",
    staff_id: "s1",
    staff_name: "Trần Thị Bình",
    created_at: "2024-06-09T08:30:00Z",
    updated_at: "2024-06-11T08:30:00Z",
  },
  {
    _id: "3",
    rental_code: "RNT-2024-003",
    customer_id: "c3",
    customer_name: "Phạm Minh Tuấn",
    customer_phone: "0923456789",
    customer_email: "phamminhtuan@email.com",
    bike_id: "3",
    bike_name: "VinFast Klara S",
    bike_type: "Xe đạp điện",
    start_date: "2024-06-10T14:00:00Z",
    end_date: "2024-06-10T20:00:00Z",
    rental_hours: 6,
    rental_days: 0,
    price_per_hour: 80000,
    price_per_day: 500000,
    total_amount: 480000,
    deposit_amount: 300000,
    payment_status: "pending",
    payment_method: "cash",
    status: "pending",
    staff_id: "s2",
    staff_name: "Hoàng Văn Cường",
    created_at: "2024-06-10T13:45:00Z",
    updated_at: "2024-06-10T13:45:00Z",
  },
  {
    _id: "4",
    rental_code: "RNT-2024-004",
    customer_id: "c4",
    customer_name: "Võ Thị Hương",
    customer_phone: "0934567890",
    customer_email: "vothihuong@email.com",
    bike_id: "5",
    bike_name: "Cannondale CAAD13",
    bike_type: "Xe đạp đường trường",
    start_date: "2024-06-08T07:00:00Z",
    end_date: "2024-06-09T19:00:00Z",
    rental_hours: 0,
    rental_days: 1,
    price_per_hour: 70000,
    price_per_day: 400000,
    total_amount: 400000,
    deposit_amount: 200000,
    payment_status: "paid",
    payment_method: "transfer",
    status: "overdue",
    notes: "Khách hàng chưa trả xe",
    staff_id: "s1",
    staff_name: "Trần Thị Bình",
    created_at: "2024-06-08T06:30:00Z",
    updated_at: "2024-06-09T19:00:00Z",
  },
  {
    _id: "5",
    rental_code: "RNT-2024-005",
    customer_id: "c5",
    customer_name: "Đặng Quốc Bảo",
    customer_phone: "0945678901",
    customer_email: "dangquocbao@email.com",
    bike_id: "6",
    bike_name: "Merida Big Nine",
    bike_type: "Xe đạp địa hình",
    start_date: "2024-06-07T10:00:00Z",
    end_date: "2024-06-07T16:00:00Z",
    actual_return_date: "2024-06-07T15:45:00Z",
    rental_hours: 6,
    rental_days: 0,
    price_per_hour: 55000,
    price_per_day: 320000,
    total_amount: 330000,
    deposit_amount: 150000,
    payment_status: "paid",
    payment_method: "zalopay",
    status: "completed",
    staff_id: "s2",
    staff_name: "Hoàng Văn Cường",
    created_at: "2024-06-07T09:30:00Z",
    updated_at: "2024-06-07T15:45:00Z",
  },
  {
    _id: "6",
    rental_code: "RNT-2024-006",
    customer_id: "c6",
    customer_name: "Bùi Thị Lan",
    customer_phone: "0956789012",
    customer_email: "buithilan@email.com",
    bike_id: "4",
    bike_name: "Specialized Sirrus",
    bike_type: "Xe đạp thành phố",
    start_date: "2024-06-09T11:00:00Z",
    end_date: "2024-06-09T15:00:00Z",
    rental_hours: 4,
    rental_days: 0,
    price_per_hour: 40000,
    price_per_day: 220000,
    total_amount: 160000,
    deposit_amount: 100000,
    payment_status: "refunded",
    payment_method: "card",
    status: "cancelled",
    notes: "Khách hàng hủy do thời tiết xấu",
    staff_id: "s1",
    staff_name: "Trần Thị Bình",
    created_at: "2024-06-09T10:45:00Z",
    updated_at: "2024-06-09T11:15:00Z",
  },
];

export default function RentalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RentalStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">(
    "all"
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredRentals = mockRentals.filter((rental) => {
    const matchesSearch =
      rental.rental_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.customer_phone.includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" || rental.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || rental.payment_status === paymentFilter;

    const matchesDateFrom =
      !dateFrom || new Date(rental.start_date) >= new Date(dateFrom);
    const matchesDateTo =
      !dateTo || new Date(rental.start_date) <= new Date(dateTo);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPayment &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const stats = {
    pending: mockRentals.filter((r) => r.status === "pending").length,
    active: mockRentals.filter((r) => r.status === "active").length,
    completed: mockRentals.filter((r) => r.status === "completed").length,
    cancelled: mockRentals.filter((r) => r.status === "cancelled").length,
    overdue: mockRentals.filter((r) => r.status === "overdue").length,
    todayRevenue: mockRentals
      .filter(
        (r) =>
          r.payment_status === "paid" &&
          new Date(r.created_at).toDateString() === new Date().toDateString()
      )
      .reduce((sum, r) => sum + r.total_amount, 0),
    totalRevenue: mockRentals
      .filter((r) => r.payment_status === "paid")
      .reduce((sum, r) => sum + r.total_amount, 0),
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý đơn thuê
            </h1>
            <p className="text-muted-foreground mt-1">
              Theo dõi và quản lý các đơn thuê xe đạp
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo đơn mới
            </Button>
          </div>
        </div>

        {/* Stats */}
        <RentalStats stats={stats} />

        {/* Filters */}
        <RentalFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          paymentFilter={paymentFilter}
          onPaymentChange={setPaymentFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          onReset={handleReset}
        />

        {/* Results */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị {filteredRentals.length} / {mockRentals.length} đơn thuê
          </p>
          <RentalTable
            rentals={filteredRentals}
            onView={(rental) => console.log("[v0] View rental:", rental._id)}
            onEdit={(rental) => console.log("[v0] Edit rental:", rental._id)}
            onComplete={(rental) =>
              console.log("[v0] Complete rental:", rental._id)
            }
            onCancel={(rental) =>
              console.log("[v0] Cancel rental:", rental._id)
            }
          />
        </div>
      </div>
    </div>
  );
}
