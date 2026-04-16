"use client";

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
import { User, Mail, Phone, Lock, Shield, MapPin, Wrench, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import type { UpdateStaffFormData } from "@schemas";
import type { Station, Supplier, TechnicianTeam } from "@/types";

// Định nghĩa interface cho dữ liệu nội bộ của Form
interface InternalFormData {
  fullname: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
  stationId: string;
  technicianTeamId: string;
}

interface CreateStaffProps {
  onSubmit: ({ data }: { data: UpdateStaffFormData }) => void;
  stations: Station[];
  suppliers: Supplier[]; 
  techTeam ?: TechnicianTeam[];
}

export default function CreateStaff({
  onSubmit,
  stations,
  suppliers,
  techTeam,
}: CreateStaffProps) {
  const navigate = useRouter();
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InternalFormData>({
    defaultValues: {
      fullname: "",
      email: "",
      phoneNumber: "",
      password: "",
      role: "STAFF", 
      stationId: "",
      technicianTeamId: "",
    },
  });

  const selectedRole = watch("role");

  // Thay formData: any bằng InternalFormData
  const onFormSubmit = (formData: InternalFormData) => {
    const role = formData.role;
    const baseData = {
      fullname: formData.fullname,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      accountStatus: "ACTIVE" as const, // Fix cứng active
    };

    // Khởi tạo biến chứa kết quả cuối cùng với kiểu chuẩn từ Schema
    let finalData: UpdateStaffFormData;

    switch (role) {
      case "STAFF":
      case "MANAGER":
      case "AGENCY":
        finalData = {
          ...baseData,
          role: role as "STAFF" | "MANAGER" | "AGENCY",
          orgAssignment: { stationId: formData.stationId },
        };
        break;
      case "TECHNICIAN":
        finalData = {
          ...baseData,
          role: "TECHNICIAN",
          orgAssignment: { technicianTeamId: formData.technicianTeamId },
        };
        break;
      default:
        // Fallback cho các trường hợp khác nếu có
        finalData = { ...baseData, role: "STAFF", orgAssignment: { stationId: formData.stationId } } as UpdateStaffFormData;
    }

    onSubmit({ data: finalData });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Tạo nhân viên"
        description="Thêm tài khoản nhân sự mới vào hệ thống"
        backLink="/admin/staffs"
      />
      
      <Card className="mx-auto max-w-4xl border-border/50 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3">
                <User className="h-5 w-5 text-primary" />
                Thông tin cơ bản
              </h3>
              
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullname" className="font-semibold text-muted-foreground">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullname"
                      {...register("fullname", { required: "Vui lòng nhập họ tên" })}
                      placeholder="Nhập họ và tên"
                      className={`pl-10 ${errors.fullname ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.fullname && <p className="text-xs text-destructive">{errors.fullname.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold text-muted-foreground">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      {...register("email", { required: "Vui lòng nhập email" })}
                      placeholder="Nhập địa chỉ email"
                      className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="font-semibold text-muted-foreground">
                    Số điện thoại <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      {...register("phoneNumber", { required: "Vui lòng nhập số điện thoại" })}
                      placeholder="Nhập số điện thoại"
                      className={`pl-10 ${errors.phoneNumber ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold text-muted-foreground">
                    Mật khẩu <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      {...register("password", { required: "Vui lòng nhập mật khẩu" })}
                      placeholder="Nhập mật khẩu"
                      className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3 mt-6">
                <Shield className="h-5 w-5 text-primary" />
                Phân quyền & Phân công
              </h3>
              
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role" className="font-semibold text-muted-foreground">
                    Chức vụ <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Chọn chức vụ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANAGER">Quản lý trạm</SelectItem>
                            <SelectItem value="STAFF">Nhân viên trạm</SelectItem>
                            <SelectItem value="TECHNICIAN">Kỹ thuật viên</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {["STAFF", "MANAGER", "AGENCY"].includes(selectedRole) && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="font-semibold text-muted-foreground">
                      Phân công Trạm <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                      <Controller
                        name="stationId"
                        control={control}
                        rules={{ required: "Vui lòng chọn trạm phân công" }}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={`pl-10 ${errors.stationId ? "border-destructive" : ""}`}>
                              <SelectValue placeholder="Chọn trạm làm việc" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              <SelectScrollUpButton />
                              {stations?.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name} - {s.address}
                                </SelectItem>
                              ))}
                              <SelectScrollDownButton />
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {errors.stationId && <p className="text-xs text-destructive">{errors.stationId.message}</p>}
                  </div>
                )}

                {selectedRole === "TECHNICIAN" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="font-semibold text-muted-foreground">
                      Đội Kỹ Thuật <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Wrench className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                      <Controller
                        name="technicianTeamId"
                        control={control}
                        rules={{ required: "Vui lòng chọn đội kỹ thuật" }}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={`pl-10 ${errors.technicianTeamId ? "border-destructive" : ""}`}>
                              <SelectValue placeholder="Chọn nhóm kỹ thuật viên" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                              <SelectScrollUpButton />
                              {techTeam?.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                              <SelectScrollDownButton />
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {errors.technicianTeamId && <p className="text-xs text-destructive">{errors.technicianTeamId.message}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-border/50">
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Tạo nhân viên"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
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