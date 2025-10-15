"use client";
import { useState, useEffect } from "react";
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
import { Progress } from "@components/ui/progress";
import { Bike, Mail, Lock, Eye, EyeOff} from "lucide-react";
import React from "react";  
import { useAuth } from "@providers/auth-providers";
import { useAuthActions } from "@hooks/useAuthAction";
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  // const { logIn ,  } = useAuthActions();
  const { user , logIn , isLoggingIn , isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const router = useRouter();
  useEffect(() => {
    if (isLoggingIn || isLoading) {
      let interval: NodeJS.Timeout;
      let currentProgress = 0;
      const messages = [
        "Đang kết nối đến máy chủ...",
        "Đang xác thực thông tin...",
        "Đang kiểm tra quyền truy cập...",
        "Đang chuẩn bị chuyển trang...",
        "Hoàn tất!"
      ];
      const messageTimings = [0, 25, 50, 75, 95];
      interval = setInterval(() => {
        currentProgress += 30; 
        const messageIndex = messageTimings.findIndex(timing => currentProgress >= timing);
        if (messageIndex !== -1 && messageIndex < messages.length) {
          setProgressMessage(messages[Math.min(messageIndex, messages.length - 1)]);
        }
        setProgressValue(Math.min(currentProgress, 100));
        if (currentProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (user?.role === "ADMIN") {
              router.push("/admin");
            } else if (user?.role === "STAFF") {
              router.push("/staff");
            } else if (user) {
              router.push("/");
            }
          }, 200);
        }
      }, 60); 
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      setProgressValue(0);
      setProgressMessage("");
    }
  }, [isLoggingIn, isLoading, user, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Không cho submit nếu đang loading
    if (isLoggingIn || isLoading) return;
    logIn({ email, password });
  };
  React.useEffect(() => {
    console.log(user);
  }, [user]);
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
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>
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
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                    transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoggingIn || isLoading}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-4" />
                    ) : (
                      <Eye className="h-5 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <Button
                  disabled={isLoggingIn || isLoading}
                  className="text-sm text-white hover:text-metro-secondary transition-colors bg-[hsl(214,100%,40%)] disabled:opacity-50"
                  onClick={() => router.push("/auth/forgot-password")}
                >
                  Quên mật khẩu?
                </Button>
              </div>
              <Button
                type="submit"
                disabled={isLoggingIn || isLoading}
                className="w-full h-12  hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 text-primary-foreground font-semibold
                bg-[hsl(214,100%,40%)] p-3 shadow-[var(--shadow-metro)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bike className="mr-2 h-5 w-5" />
                {isLoggingIn ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
            
            {/* Progress indicators */}
            {(isLoggingIn || isLoading) && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progressMessage}
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {progressValue}%
                  </span>
                </div>
                <Progress value={progressValue} className="h-2" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Vui lòng đợi trong giây lát...
                  </p>
                </div>
              </div>
            )}
            <Separator className="my-6" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Button
                  disabled={isLoggingIn || isLoading}
                  className="text-sm text-metro-primary hover:text-metro-secondary transition-colors text-white bg-[hsl(214,100%,40%)] disabled:opacity-50"
                  onClick={() => router.push("/auth/register")}
                >
                  Đăng ký ngay
                </Button>
              </p>
            </div>

            <div className="text-center pt-4">
              <Button
                disabled={isLoggingIn || isLoading}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-white bg-[hsl(214,100%,40%)] disabled:opacity-50"
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
