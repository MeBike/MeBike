import { Bike, Mail, Send } from "lucide-react";
import React, { useState } from "react";
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
interface ForgotPasswordProps {
  email: string;
  setEmail: (email: string) => void;
  handleBackToLogin: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}
export default function ForgotPassword({
  email,
  setEmail,
  handleBackToLogin,
  onSubmit,
  isLoading,
}: ForgotPasswordProps) {
  const router = useRouter();
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-metro-primary via-metro-secondary to-metro-accent flex items-center justify-center p-4 
      bg-[linear-gradient(135deg,hsl(214_100%_40%)_0%,hsl(215_16%_47%)_100%)]"
    >
      <div className="w-full max-w-md">
        <div className="text-center animate-fade-in mb-6">
          <div className="flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-floating">
              <Bike className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            MeBike
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
            <form onSubmit={onSubmit} className="space-y-4">
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
                disabled={isLoading}
                className="w-full h-12 hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 text-primary-foreground font-semibold
                  bg-[hsl(214,100%,40%)] p-3 shadow-[var(--shadow-metro)] text-white"
              >
                {isLoading ? (
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
                <Button onClick={handleBackToLogin} variant="link">
                  Đăng nhập ngay
                </Button>
              </p>
            </div>

            <div className="text-center pt-4">
              <Button variant="link" onClick={() => router.push("/")}>
                ← Về trang chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
