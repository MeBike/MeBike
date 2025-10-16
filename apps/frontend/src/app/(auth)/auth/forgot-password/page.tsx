"use client";
import { useState } from "react";
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
import { Bike, Mail, ArrowLeft, Send } from "lucide-react";
import React from "react";
import { useAuthActions } from "@hooks/useAuthAction";

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const { forgotPassword, isLoadingForgottingPassword } = useAuthActions();
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        forgotPassword({ email });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Forgot password error:', error);
    }
  };

  const handleBackToLogin = () => {
    router.push("/auth/login");
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metro-primary via-metro-secondary to-metro-accent flex items-center justify-center p-4 
        bg-[linear-gradient(135deg,hsl(214_100%_40%)_0%,hsl(215_16%_47%)_100%)]">
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
            <CardHeader className="space-y-2 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
                Email đã được gửi!
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
                Vui lòng kiểm tra hộp thư (và cả thư mục spam).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Button
                  onClick={handleBackToLogin}
                  className="w-full h-12 hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 text-primary-foreground font-semibold
                    bg-[hsl(214,100%,40%)] p-3 shadow-[var(--shadow-metro)] text-white"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Quay lại đăng nhập
                </Button>
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Không nhận được email?
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="text-sm text-metro-primary hover:text-metro-secondary transition-colors"
                >
                  Gửi lại email
                </Button>
              </div>

              <div className="text-center pt-4">
                <Button
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-white bg-[hsl(214,100%,40%)]"
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-metro-primary via-metro-secondary to-metro-accent flex items-center justify-center p-4 
      bg-[linear-gradient(135deg,hsl(214_100%_40%)_0%,hsl(215_16%_47%)_100%)]">
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
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
              Quên mật khẩu
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                
              <Button
                type="submit"
                disabled={isLoadingForgottingPassword}
                className="w-full h-12 hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 text-primary-foreground font-semibold
                  bg-[hsl(214,100%,40%)] p-3 shadow-[var(--shadow-metro)] text-white"
              >
                {isLoadingForgottingPassword ? (
                  <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Gửi email đặt lại mật khẩu
                  </>
                )}
              </Button>
            </form>
            
            <Separator className="my-6" />
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Nhớ mật khẩu rồi?{" "}
                <Button
                  onClick={handleBackToLogin}
                  className="text-sm text-metro-primary hover:text-metro-secondary transition-colors text-white bg-[hsl(214,100%,40%)]"
                >
                  Đăng nhập ngay
                </Button>
              </p>
            </div>

            <div className="text-center pt-4">
              <Button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-white bg-[hsl(214,100%,40%)]"
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

export default ForgotPassword;