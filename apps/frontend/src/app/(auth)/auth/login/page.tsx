"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bike, Mail, Lock, Eye, EyeOff} from "lucide-react";
import React from "react";  
import { useAuth } from "@providers/auth-providers";
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { logIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    logIn({ email, password });
    console.log("Login with:", { email, password });
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
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                    transition-all duration-200"
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
                    className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                    transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
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
                  className="text-sm text-metro-primary hover:text-metro-secondary transition-colors"
                  onClick={() => router.push("/auth/forgot-password")}
                >
                  Quên mật khẩu?
                </Button>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 text-primary-foreground font-semibold
                bg-[hsl(214,100%,40%)] p-3 shadow-[var(--shadow-metro)] text-white"
              >
                <Bike className="mr-2 h-5 w-5" />
                Đăng nhập
              </Button>
              {/* <Separator className="my-1" />
              <Button
                className="w-full h-12 bg-white hover:bg-gray-50 shadow-md hover:shadow-lg 
             transition-all duration-300 border border-gray-200 
             text-black font-medium p-3 flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#4285F4"
                    d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.85-6.85C35.59 2.38 30.12 0 24 0 14.62 0 6.39 5.34 2.54 13.11l7.98 6.2C12.38 13.05 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#34A853"
                    d="M46.5 24.5c0-1.56-.14-3.06-.39-4.5H24v9h12.7c-.54 2.9-2.18 5.36-4.65 7.04l7.27 5.64C43.72 37.08 46.5 31.22 46.5 24.5z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.52 28.31A14.49 14.49 0 0 1 9.5 24c0-1.49.27-2.93.75-4.31l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.82.92 7.42 2.54 10.61l7.98-6.3z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 48c6.12 0 11.28-2.02 15.04-5.49l-7.27-5.64c-2.02 1.36-4.62 2.13-7.77 2.13-6.26 0-11.62-3.55-14.48-8.81l-7.98 6.3C6.39 42.66 14.62 48 24 48z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </Button> */}
            </form>

            <Separator className="my-6" />

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Button
                  className="text-sm text-metro-primary hover:text-metro-secondary transition-colors"
                  onClick={() => router.push("/auth/register")}
                >
                  Đăng ký ngay
                </Button>
              </p>
            </div>

            {/* Back to Home */}
            <div className="text-center pt-4">
              <Button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
