"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bike, Mail, Lock, Eye, EyeOff, User } from "lucide-react";

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCheckedChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreeTerms: checked,
    }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (!formData.agreeTerms) {
      alert("Vui lòng đồng ý với điều khoản sử dụng!");
      return;
    }
    // TODO: Integrate with Supabase auth
    console.log("Register with:", formData);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-metro-primary via-metro-secondary to-metro-accent flex items-center justify-center p-4 
    bg-[linear-gradient(135deg,hsl(214_100%_40%)_0%,hsl(215_16%_47%)_100%)] 
    overflow-hidden"
    >
      <div className="w-full max-w-md">
        <div className="text-center animate-fade-in mb-4">
          <div className="flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-floating">
              <Bike className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mt-3 tracking-tight">
            MetroBike
          </h1>
        </div>
      
        <Card className="shadow-floating border-0 bg-white/95 backdrop-blur-xl relative z-10 overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
          <div className="h-1 bg-gradient-metro rounded-t-lg"></div>
          <CardHeader className="space-y-2 text-center ">
            <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
              Đăng ký
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Nhập thông tin để tạo tài khoản mới
            </CardDescription>
          </CardHeader>
        
          <CardContent className="space-y-4 overflow-y-auto">
            
            <form onSubmit={handleRegister} className="space-y-4">
            
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Họ và tên
                </Label>
                <div className="relative">
                 
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    name="fullName" 
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName} 
                    onChange={handleInputChange} 
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiếu 8 ký tự"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-4" />
                    ) : (
                      <Eye className="h-5 w-4" />
                    )}
                  </button>
                </div>
              </div>

             
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-4" />
                    ) : (
                      <Eye className="h-5 w-4" />
                    )}
                  </button>
                </div>
              </div>

         
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) =>
                    handleCheckedChange(checked as boolean)
                  }
                  className="mt-1"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tôi đồng ý với{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    className="font-medium text-primary hover:underline"
                  >
                    điều khoản sử dụng
                  </a>{" "}
                  và{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="font-medium text-primary hover:underline"
                  >
                    chính sách bảo mật
                  </a>
                </label>
              </div>

    
              <div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 text-primary-foreground font-semibold
                  bg-[hsl(214,100%,40%)] p-3 shadow-[var(--shadow-metro)] text-white"
                  disabled={!formData.agreeTerms}
                >
                  <Bike className="mr-2 h-5 w-5" />
                  Đăng ký
                </Button>
              </div>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <Button
                  variant="link"
                  className="text-sm text-primary p-0 h-auto"
                  onClick={() => router.push("/auth/login")}
                >
                  Đăng nhập ngay
                </Button>
              </p>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors p-0 h-auto"
                onClick={() => router.push("/")}
              >
                ← Về trang chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
