import React , { Dispatch, SetStateAction } from "react";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@radix-ui/react-label";
import { Bike, Mail, Lock, Eye, EyeOff, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RegisterSchemaFormData, registerSchema } from "@/schemas/authSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
interface RegisterFormProps {
  handleRegister: (data: RegisterSchemaFormData) => void;
  agreeTerms: boolean;
  setAgreeTerms: Dispatch<SetStateAction<boolean>>;
}
const RegisterForm = ({ handleRegister , agreeTerms , setAgreeTerms }: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword,setShowConfirmPassword] = useState<boolean>(false);
    const router = useRouter();
  const { 
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchemaFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      YOB: 2000,
      confirmPassword: "",
    },
  });

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
            MeBike
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
            <form onSubmit={handleSubmit(handleRegister)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  Họ và tên
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    {...register("name")}
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              </div>
              {/* Năm sinh */}
              <div className="space-y-2">
                <Label htmlFor="YOB" className="text-sm font-medium">
                  Năm sinh
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="YOB"
                    {...register("YOB", { valueAsNumber: true })}
                    type="number"
                    placeholder="2000"
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                  {errors.YOB && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.YOB.message}
                    </p>
                  )}
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
                    {...register("email")}
                    type="email"
                    placeholder="example@email.com"
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-sm font-medium">
                  Số điện thoại (tùy chọn)
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    {...register("phone")}
                    type="tel"
                    placeholder="0912345678"
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.phone.message}
                    </p>
                  )}
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
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiếu 8 ký tự"
                    className="pl-10 pr-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
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
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Tối thiếu 8 ký tự"
                    className="pl-10 pr-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
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
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) =>
                    setAgreeTerms(checked as boolean)
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
                  disabled={!agreeTerms || isSubmitting}
                >
                  <Bike className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
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

export default RegisterForm;
