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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateUserFormData } from "@/schemas/user-schema";
interface CreateUserProps {
  onSubmit: ({data}: {data: CreateUserFormData}) => void;
}
export default function CreateUser({ onSubmit }: CreateUserProps) {
  const navigate = useRouter();
  const [formData, setFormData] = useState({
    fullname : "",
    phoneNumber : "",
    email : "",
    role : "USER",
    password : "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data : CreateUserFormData = { 
        fullname: formData.fullname,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password : formData.password,
        role : formData.role as "USER",
    }
    onSubmit({data});
  };

  return (
    <div>
      <PageHeader
        title="Tạo người dùng"
        description="Tạo tài khoản người dùng"
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
                  <Label htmlFor="fullname"><span className="text-red-500">*</span>Họ và tên:</Label>
                  <Input
                    id="fullname"
                    value={formData.fullname}
                    onChange={(e) => handleChange("fullname", e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email"><span className="text-red-500">*</span>Email:</Label>
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
                  <Label htmlFor="phoneNumber"><span className="text-red-500">*</span>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange("phoneNumber", e.target.value)}
                      placeholder="Enter phone number"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password"><span className="text-red-500">*</span>Mật khẩu:</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                  <Label htmlFor="role"><span className="text-red-500">*</span>Chức vụ:</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange("role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="gradient-primary shadow-glow">
                Tạo người dùng
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate.push("/admin/customers")}
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
