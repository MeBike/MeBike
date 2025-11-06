"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthActions } from "@/hooks/useAuthAction";
import { useAuth } from "@/providers/auth-providers";

interface VerifyEmailModalProps {
  isAuthenticated?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, otp: string) => Promise<void>;
  onSkip?: () => void;
  isLoading?: boolean;
  defaultEmail?: string;
}

export function VerifyEmailModal({
  isAuthenticated,
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  isLoading = false,
  defaultEmail,
}: VerifyEmailModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(defaultEmail || user?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Email không hợp lệ");
      return;
    }
    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP");
      return;
    }
    if (otp.trim().length < 4) {
      setError("Mã OTP phải có ít nhất 4 ký tự");
      return;
    }
    try {
      setError("");
      await onSubmit(email.trim(), otp.trim());
      setOtp("");
      setEmail("");
    } catch (err) {
      console.log(err);
    }
  };

  const handleClose = () => {
    setOtp("");
    setEmail(user?.email || "");
    setError("");
    onClose();
  };

  const handleValidateOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP");
      return;
    }

    if (otp.trim().length < 4) {
      setError("Mã OTP phải có ít nhất 4 ký tự");
      return;
    }

    try {
      setError("");
      await onSubmit(email, otp.trim());
      setOtp("");
      setEmail(user?.email || "");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Xác thực Email
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            Vui lòng nhập mã OTP được gửi đến email của bạn
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleValidateOTP} className="space-y-5 mt-6">
          {/* <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                disabled
                className="pl-10 bg-background border-border"
              />
            </div>
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-medium">
              Mã OTP <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="otp"
                type="text"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  if (error) setError("");
                }}
                disabled={isLoading}
                maxLength={10}
                className={cn(
                  "pl-10 bg-background border-border text-center font-mono tracking-widest text-lg",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            {isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 cursor-pointer"
              >
                Hủy
              </Button>
            )}
            {onSkip && (
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                disabled={isLoading}
                className="flex-1 cursor-pointer"
              >
                Bỏ qua
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 gap-2 cursor-pointer bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                "Xác thực OTP"
              )}
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Không nhận được mã? Hãy kiểm tra thư mục spam hoặc yêu cầu gửi lại
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
