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
import type { UpdateStaffFormData } from "@/schemas/user-schema";
import type { Station, Supplier, TechnicianTeam } from "@/types";

interface CreateStaffProps {
  onSubmit: ({ data }: { data: UpdateStaffFormData }) => void;
  stations: Station[];
  suppliers: Supplier[]; // Đang được dùng làm Technician Teams
  techTeam ?: TechnicianTeam[];
}

export default function CreateStaff({
  onSubmit,
  stations,
  suppliers,
  techTeam,
}: CreateStaffProps) {
  const navigate = useRouter();

  // Khởi tạo Form. Vì stationId và technicianTeamId là field động nên mình khai báo thêm vào form type
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullname: "",
      email: "",
      phoneNumber: "",
      password: "",
      role: "STAFF", // Nên để mặc định là STAFF cho trang tạo nhân viên
      stationId: "",
      technicianTeamId: "",
    },
  });

  // Lắng nghe sự thay đổi của role để render form Động
  const selectedRole = watch("role");

  const onFormSubmit = (formData: any) => {
    const role = formData.role.toUpperCase();
    const baseData = {
      fullname: formData.fullname,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
    };

    let finalData: any; // Format lại data giống logic cũ của bạn

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
        finalData = { ...baseData, role };
    }

    onSubmit({ data: finalData as UpdateStaffFormData });
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
            
            {/* SECTION 1: THÔNG TIN CƠ BẢN */}
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3">
                <User className="h-5 w-5 text-primary" />
                Thông tin cơ bản
              </h3>
              
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                {/* Field: Họ và tên */}
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
                  {errors.fullname && <p className="text-xs text-destructive">{errors.fullname.message as string}</p>}
                </div>

                {/* Field: Email */}
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
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
                </div>

                {/* Field: Số điện thoại */}
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
                  {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message as string}</p>}
                </div>

                {/* Field: Mật khẩu */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold text-muted-foreground">
                    Mật khẩu <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    {/* Đã sửa icon thành Lock */}
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      {...register("password", { required: "Vui lòng nhập mật khẩu" })}
                      placeholder="Nhập mật khẩu"
                      className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
                </div>
              </div>
            </div>

            {/* SECTION 2: PHÂN QUYỀN VÀ ĐƠN VỊ */}
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border/50 pb-3 mt-6">
                <Shield className="h-5 w-5 text-primary" />
                Phân quyền & Phân công
              </h3>
              
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
                
                {/* Field: Chức vụ */}
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
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Chọn chức vụ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Quản trị viên (ADMIN)</SelectItem>
                            <SelectItem value="MANAGER">Quản lý trạm (MANAGER)</SelectItem>
                            <SelectItem value="STAFF">Nhân viên trạm (STAFF)</SelectItem>
                            <SelectItem value="TECHNICIAN">Kỹ thuật viên (TECHNICIAN)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Field: Chọn Trạm (Chỉ hiện khi là STAFF, MANAGER, AGENCY) */}
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
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
                    {errors.stationId && <p className="text-xs text-destructive">{errors.stationId.message as string}</p>}
                  </div>
                )}

                {/* Field: Chọn Đội kỹ thuật (Chỉ hiện khi là TECHNICIAN) */}
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
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
                    {errors.technicianTeamId && <p className="text-xs text-destructive">{errors.technicianTeamId.message as string}</p>}
                  </div>
                )}

              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-6 border-t border-border/50">
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px] gradient-primary shadow-glow">
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