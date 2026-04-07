"use client";
import { useState } from "react";
import { PageHeader } from "@components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateUserFormData } from "@/schemas/user-schema";
import { Station, Supplier } from "@/types";
interface CreateStaffProps {
  onSubmit: ({ data }: { data: CreateUserFormData }) => void;
  stations: Station[];
  suppliers: Supplier[];
}
export default function CreateStaff({
  onSubmit,
  stations,
  suppliers,
}: CreateStaffProps) {
  const navigate = useRouter();
  const [formData, setFormData] = useState({
    fullname: "",
    phoneNumber: "",
    password: "",
    email: "",
    role: "USER",
    stationId: "",
    technicianTeamId: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleClearData = () => {
    setFormData({
      fullname: "",
      phoneNumber: "",
      password: "",
      email: "",
      role: "USER",
      stationId: "",
      technicianTeamId: "",
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = formData.role.toUpperCase() as CreateUserFormData["role"];
    const baseData = {
      fullname: formData.fullname,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
    };
    let finalData: CreateUserFormData;
    switch (role) {
      case "STAFF":
      case "MANAGER":
      case "AGENCY":
        finalData = {
          ...baseData,
          role,
          orgAssignment: { stationId: formData.stationId },
        };
        break;
      case "TECHNICIAN":
        finalData = {
          ...baseData,
          role,
          orgAssignment: { technicianTeamId: formData.technicianTeamId },
        };
        break;
      case "ADMIN":
      case "USER":
        finalData = { ...baseData, role };
        break;
      default:
        throw new Error("Invalid role");
    }
    onSubmit({ data: finalData });
    handleClearData();
  };

  return (
    <div>
      <PageHeader
        title="Tạo nhân viên"
        description="Tạo tài khoản nhân viên"
        backLink="/admin/customers"
      />
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <span className="text-red-500">*</span>Họ và tên:
                  </Label>
                  <Input
                    id="name"
                    value={formData.fullname}
                    onChange={(e) => handleChange("fullname", e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <span className="text-red-500">*</span>Email:
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="Enter email address"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    <span className="text-red-500">*</span>Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleChange("phoneNumber", e.target.value)
                      }
                      placeholder="Enter phone number"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    <span className="text-red-500">*</span>Mật khẩu:
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="Enter password"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    <span className="text-red-500">*</span>Chức vụ:
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                      <SelectItem value="MANAGER">MANAGER</SelectItem>
                      <SelectItem value="STAFF">STAFF</SelectItem>
                      <SelectItem value="AGENCY">AGENCY</SelectItem>
                      <SelectItem value="TECHNICIAN">TECHNICIAN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {(formData.role === "STAFF" || formData.role === "MANAGER") && (
                <div className="space-y-2">
                  <Label>Trạm ID:</Label>
                  <Select
                    value={formData.stationId}
                    onValueChange={(value) => handleChange("stationId", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn trạm" />
                    </SelectTrigger>

                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectScrollUpButton />
                      {stations.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} - {s.address}
                        </SelectItem>
                      ))}
                      <SelectScrollDownButton />
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* TECHNICIAN: Hiện chọn nhóm kỹ thuật viên (Technician Team) */}
              {formData.role === "TECHNICIAN" && (
                <div className="space-y-2">
                  <Label>Đội kỹ thuật:</Label>
                  <Select
                    value={formData.technicianTeamId}
                    onValueChange={(value) =>
                      handleChange("technicianTeamId", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn nhóm kỹ thuật viên" />
                    </SelectTrigger>

                    <SelectContent className="max-h-60 overflow-y-auto">
                      <SelectScrollUpButton />
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} - {s.address}
                        </SelectItem>
                      ))}
                      <SelectScrollDownButton />
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* ADMIN: Không thoả mãn điều kiện nào ở trên nên sẽ không render gì cả */}
            </div>
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="gradient-primary shadow-glow">
                Tạo nhân viên
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate.push("/admin/staffs")}
              >
                Hủy bỏ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
