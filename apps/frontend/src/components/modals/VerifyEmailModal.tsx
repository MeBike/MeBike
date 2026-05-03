"use client";

import { useState, useRef } from "react";
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
import { Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-providers";
interface VerifyEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<void>;
  isLoading?: boolean;
}

export function VerifyEmailModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: VerifyEmailModalProps) {
  const { user } = useAuth();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 chữ số");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(otpString);
      // Only close modal and reset if successful
      setOtp(["", "", "", "", "", ""]);
      setError("");
      onClose();
    } catch (err) {
      console.log(err);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setIsSubmitting(false);
    onClose();
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
            Nhập mã OTP được gửi đến email của bạn
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Email Display */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="pl-10 bg-background border-border opacity-70 cursor-not-allowed"
              />
            </div>
          </div> 

          {/* OTP Input - 6 Digits */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Mã OTP <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isSubmitting || isLoading}
                  className={cn(
                    "w-12 h-12 text-center font-bold text-lg rounded-lg border-2 transition-all",
                    digit
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 bg-white hover:border-gray-400",
                    error && "border-destructive",
                    (isSubmitting || isLoading) && "opacity-50 cursor-not-allowed"
                  )}
                />
              ))}
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">
                {error}
              </p>
            )}
          </div>

          {/* Info Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              💡 Kiểm tra thư mục spam nếu không thấy email
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
              className="flex-1 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2 cursor-pointer bg-primary hover:bg-primary/90"
              disabled={isSubmitting || isLoading || otp.join("").length !== 6}
            >
              {isSubmitting || isLoading ? (
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
