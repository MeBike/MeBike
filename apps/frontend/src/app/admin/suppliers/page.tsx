"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Supplier, StatsSupplierBike } from "@custom-types";
import { Plus, Download, Edit2, Trash2, Eye, X } from "lucide-react";
import { useSupplierActions } from "@/hooks/useSupplierAction";
import { useBikeActions } from "@/hooks/useBikeAction";
import {
  CreateSupplierSchema,
  createSupplierSchema,
} from "@/schemas/supplier.schema";
import { Input } from "@/components/ui/input";
const getStatusColor = (status: "HOẠT ĐỘNG" | "NGƯNG HOẠT ĐỘNG") => {
  return status === "HOẠT ĐỘNG"
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
};

export default function SuppliersPage() {
  const {
    register: create,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierSchema>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: "",
      address: "",
      phone_number: "",
      contract_fee: "",
    },
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "HOẠT ĐÔNG" | "NGƯNG HOẠT ĐỘNG" | ""
  >("");
  const { useGetAllBikeQuery } = useBikeActions(true);
  const {
    useGetAllSupplierQuery,
    useGetAllStatsSupplierQuery,
    createSupplier,
  } = useSupplierActions(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone_number: "",
    contract_fee: "",
  });
  const { data: supplierData, isLoading: isLoadingGetAllSuppliers } =
    useGetAllSupplierQuery(1, 10, statusFilter);
  const { data: statsData, isLoading: isLoadingStats } =
    useGetAllStatsSupplierQuery();
  const { data: bikeData, isLoading: isLoadingBike } = useGetAllBikeQuery();
  const handleAddSupplier = (data : CreateSupplierSchema) => {
    console.log("[v0] Adding supplier:", data);
    createSupplier({
      name: data.name,
      address: data.address,
      phone_number: data.phone_number,
      contract_fee: data.contract_fee,
    });
    setIsModalOpen(false);
  };
  const handleChangeStatusFilter = (
    status: "HOẠT ĐÔNG" | "NGƯNG HOẠT ĐỘNG" | ""
  ) => {
    setStatusFilter(status);
  };
  return (
    <div>
      {isLoadingGetAllSuppliers && isLoadingStats && isLoadingBike ? (
        <div>Loading suppliers...</div>
      ) : (
        <div className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Tổng nhà cung cấp</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {supplierData?.pagination.totalRecords || 0}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-500 mt-1">
                {supplierData?.data?.filter((s) => s.status === "HOẠT ĐỘNG")
                  .length || 0}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Tổng xe đạp</p>
              <p className="text-2xl font-bold text-blue-500 mt-1">
                {bikeData?.pagination.totalRecords || 0}
              </p>
            </div>
          </div>

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
                  handleChangeStatusFilter(
                    e.target.value as "HOẠT ĐÔNG" | "NGƯNG HOẠT ĐỘNG" | ""
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
                  setStatusFilter("");
                }}
              >
                Đặt lại
              </Button>
            </div>
          </div>

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
                {supplierData?.data?.map((supplier) => (
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

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              Thống kê xe đạp theo nhà cung cấp
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statsData?.result?.map((stat: StatsSupplierBike) => (
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
                      <span className="text-muted-foreground">
                        Không có sẵn:
                      </span>
                      <span className="font-medium text-gray-600">
                        {stat.unavailable_bikes}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <form
                onSubmit={handleSubmit(handleAddSupplier)}
                className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
              >
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
                      <Input
                        id="full_name"
                        {...create("name")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập tên nhà cung cấp"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Địa chỉ
                      </label>
                      <Input
                        type="text"
                        id="address"
                        {...create("address")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập địa chỉ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Số điện thoại
                      </label>
                      <Input
                        type="text"
                        id="phone_number"
                        {...create("phone_number")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập số điện thoại"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Phí hợp đồng
                      </label>
                      <Input
                        type="number"
                        id="contract_fee"
                        {...create("contract_fee")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Nhập phí hợp đồng"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1"
                      >
                        Hủy
                      </Button>
                      <Button type="submit" className="flex-1">
                        Thêm nhà cung cấp
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
