"use client";
import React, { useState } from "react";
import { EmailVerificationForm } from "@/components/auth/EmailVerificationForm";
import { useAuthActions } from "@/hooks/useAuthAction";
import { useRouter } from "next/navigation";
import { useUserProfileQuery } from "@/hooks/query/useUserProfileQuery";
const Page = () => {
  const { data: userProfile } = useUserProfileQuery(true);
  const email = userProfile?.email ?? "";
  const router = useRouter();
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const { verifyEmail } = useAuthActions();
  const handleVerifyEmailSubmit = async (otp: string) => {
    setIsVerifyingEmail(true);
    try {
      console.log("Verifying OTP:", otp);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;
      console.log("Token exists:", !!token);
      await verifyEmail({userId: userProfile?.id || "", otp : otp});
      console.log("OTP verified successfully!");
    } catch (err) {
      console.log("Verification error (caught):", err);
      throw err;
    } finally {
      setIsVerifyingEmail(false);
    }
  };
  const handleSkipVerification = () => {
    router.push("/user/profile");
  };
  return (
    <>
      <EmailVerificationForm
        email={email}
        onSubmit={handleVerifyEmailSubmit}
        onSkip={handleSkipVerification}
        isLoading={isVerifyingEmail}
      />
    </>
  );
};
export default Page;
