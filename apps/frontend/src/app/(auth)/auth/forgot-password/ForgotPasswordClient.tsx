"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { useAuthActions } from "@hooks/useAuthAction";
import { ResetPasswordOtpForm } from "@/components/auth/ResetPasswordOtpForm";
import { ResetPasswordNewForm } from "@/components/auth/ResetPasswordNewForm";
import ForgotPasswordForm from "./components/forgot-password-form";
import { getResetToken } from "@/utils/tokenManager";

const ForgotPasswordClient = () => {
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(300);
  const { forgotPassword, isLoadingForgottingPassword, resetPassword, isReseting , verifyOTP} = useAuthActions();
  const router = useRouter();
  useEffect(() => {
    console.log(otp);
  }, [otp]);
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      forgotPassword({ email });
      setStep("otp");
    } catch (error) {
      console.error('Forgot password error:', error);
    }
  };

  const handleVerifyOtp = async (otpParam: string) => {
    try {
      setOtp(otpParam);
      const response = await verifyOTP({ email, otp: otpParam });
      console.log("OTP verification response:", response);
      setResetToken(getResetToken() || "");
      setStep("password");
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const handleResetPassword = async ( otpParam: string, newPassword: string, confirmPassword: string) => {
    try {
      await resetPassword({
        otp: resetToken,
        password: newPassword,
        confirm_password: confirmPassword,
      });
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const handleBackToLogin = () => {
    router.push("/auth/login");
  };

  const handleBackFromOtp = () => {
    setStep("email");
    setEmail("");
  };

  const handleBackFromPassword = () => {
    setStep("otp");
  };

  const handleResendOtp = async () => {
    try {
      console.log("📧 Resending OTP to:", email);
      forgotPassword({ email });
      console.log("✅ OTP resent successfully");
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };

  if (step === "otp") {
    return (
      <ResetPasswordOtpForm
        email={email}
        onSubmit={handleVerifyOtp}
        onBack={handleBackFromOtp}
        isLoading={isReseting}
        timeLeft={timeLeft}
        onTimeLeftChange={setTimeLeft}
        onResendOtp={handleResendOtp}
      />
    );
  }

  if (step === "password") {
    return (
      <ResetPasswordNewForm
        email={email}
        otp={otp}
        onSubmit={handleResetPassword}
        onBack={handleBackFromPassword}
        isLoading={isReseting}
      />
    );
  }
  return (
    <ForgotPasswordForm
      email={email}
      setEmail={setEmail} 
      onSubmit={handleSendEmail}
      isLoading={isLoadingForgottingPassword}
      handleBackToLogin={handleBackToLogin}
    />
  );
};

export default ForgotPasswordClient;