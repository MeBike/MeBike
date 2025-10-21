"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { Bike, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import React from "react";
import { useAuth } from "@providers/auth-providers";
import { toast } from "sonner";
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { user, logIn, isLoggingIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user || isNavigating) {
      if(user?.role === "ADMIN"){
        router.push("/admin");
      } else if(user?.role === "STAFF"){
        router.push("/staff");
      } else if (user?.role === "USER"){
        router.push("/user");
      }
      return;

    }
  }, [user, isNavigating, router]);
const resetFormData = () => {
  setEmail("");
  setPassword("");
};
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  if (isLoggingIn || isLoading || isNavigating) return;
  setIsNavigating(true);
  logIn({ email, password }, (success) => {
    if (!success) setIsNavigating(false);
  });
  resetFormData();
};


  return (
    <div
      className="min-h-screen bg-gradient-to-br from-metro-primary via-metro-secondary to-metro-accent flex items-center justify-center p-4 
    bg-[linear-gradient(135deg,hsl(214_100%_40%)_0%,hsl(215_16%_47%)_100%)] "
    >
      <div className="w-full max-w-md">
        <div className="text-center animate-fade-in mb-6">
          <div className="flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-floating">
              <Bike className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            MetroBike
          </h1>
        </div>
        <Card className="shadow-floating border-0 bg-white/95 backdrop-blur-xl relative z-10 overflow-hidden animate-scale-in">
          <div className="h-1 bg-gradient-metro rounded-t-lg"></div>
          <CardHeader className="space-y-2 text-center ">
            <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
              Đăng nhập
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Nhập thông tin để truy cập tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoggingIn || isLoading}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn || isLoading}
                    className="pl-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn || isLoading}
                    className="absolute right-3 top-3"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-4" />
                    ) : (
                      <Eye className="h-5 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="text-right">
                <Button
                  type="button"
                  disabled={isLoggingIn || isLoading}
                  variant="link"
                  onClick={() => router.push("/auth/forgot-password")}
                >
                  Quên mật khẩu?
                </Button>
              </div>

              {/* Login button */}
              <Button
                type="submit"
                disabled={isLoggingIn || isLoading || isNavigating}
                className="w-full h-12"
              >
                {isLoggingIn || isLoading || isNavigating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  <>
                    <Bike className="mr-2 h-5 w-5" />
                    Đăng nhập
                  </>
                )}
              </Button>
            </form>

            <Separator className="my-6" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Button
                  disabled={isLoggingIn || isLoading}
                  variant="link"
                  onClick={() => router.push("/auth/register")}
                >
                  Đăng ký ngay
                </Button>
              </p>
            </div>

            <div className="text-center pt-4">
              <Button
                disabled={isLoggingIn || isLoading}
                variant="link"
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

export default Login;
