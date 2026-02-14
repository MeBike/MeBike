"use client";
import React, { useState } from "react";
import { EmailVerificationForm } from "@/components/auth/EmailVerificationForm";
import { useAuthActions } from "@/hooks/useAuthAction";
import { useRouter } from "next/navigation";
const page = () => {
  const [registeredEmail, setRegisteredEmail] = useState("");
  const router = useRouter();
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const { verifyEmail } = useAuthActions();
  const handleVerifyEmailSubmit = async (email: string, otp: string) => {
    try {
      console.log("Verifying OTP:", otp);
      console.log("Registered email:", registeredEmail);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;
      console.log("Token exists:", !!token);
      await verifyEmail({ email: registeredEmail, otp });
      console.log("OTP verified successfully!");
    } catch (err) {
      console.log("Verification error (caught):", err);
      throw err;
    }
  };
  const handleSkipVerification = () => {
    router.push("/user/profile");
  };
  return (
    <>
      <EmailVerificationForm
        email={registeredEmail}
        onSubmit={handleVerifyEmailSubmit}
        onSkip={handleSkipVerification}
        isLoading={isVerifyingEmail}
      />
    </>
  );
};
export default page;
