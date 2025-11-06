"use client";
import { useState, useRef, useEffect } from "react";
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
import { Mail, Lock, Loader2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailVerificationFormProps {
  email: string;
  onSubmit: (email: string, otp: string) => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
  onBack?: () => void;
}

export function EmailVerificationForm({
  email,
  onSubmit,
  onSkip,
  isLoading = false,
  onBack,
}: EmailVerificationFormProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up, trigger skip
          if (timerRef.current) clearInterval(timerRef.current);
          onSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onSkip]);

  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last digit
    setOtp(newOtp);
    setError("");

    // Auto focus next input
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
      await onSubmit(email, otpString);
      // Show loading screen after successful verification
      setShowLoading(true);
    } catch (err) {
      console.log(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-metro-primary via-metro-secondary to-metro-accent flex items-center justify-center p-4 
    bg-[linear-gradient(135deg,hsl(214_100%_40%)_0%,hsl(215_16%_47%)_100%)] 
    overflow-hidden"
    >
      {showLoading ? (
        // Loading Screen
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
          <p className="text-white text-xl font-semibold">Đang xác thực...</p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className="text-center animate-fade-in mb-4">
            <div className="flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-floating">
                <Mail className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mt-3 tracking-tight">
              Xác thực Email
            </h1>
          </div>

          <Card className="shadow-floating border-0 bg-white/95 backdrop-blur-xl relative z-10 overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            <div className="h-1 bg-gradient-metro rounded-t-lg"></div>
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
                Xác thực Email
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Nhập mã OTP được gửi đến <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
              <div className="pt-2 text-sm">
                <span className={cn(
                  "font-semibold",
                  timeLeft <= 60 ? "text-destructive" : "text-amber-600"
                )}>
                  ⏱️ Thời gian còn lại: {formatTime(timeLeft)}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Display */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="pl-10 h-12 w-full rounded-lg border border-gray-300 bg-gray-50 shadow-sm opacity-70 cursor-not-allowed"
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-700">
                    💡 Kiểm tra thư mục spam nếu không thấy email. Mã OTP có hiệu lực trong 10 phút.
                  </p>
                </div>

                {/* Buttons */}
                <div className="space-y-3 pt-4">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 text-primary-foreground font-semibold
                    bg-[hsl(214,100%,40%)] p-3 shadow-[var(--shadow-metro)] text-white gap-2 cursor-pointer"
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

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onSkip}
                      disabled={isSubmitting || isLoading}
                      className="h-12 cursor-pointer gap-2"
                    >
                      Bỏ qua
                    </Button>
                    {onBack && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        disabled={isSubmitting || isLoading}
                        className="h-12 cursor-pointer gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Quay lại
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
