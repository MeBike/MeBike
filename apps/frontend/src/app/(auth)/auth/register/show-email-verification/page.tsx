"use client";
import React, { useState } from "react";
import { EmailVerificationForm } from "@/components/auth/EmailVerificationForm";
import { useAuthActions } from "@/hooks/useAuthAction";
import { useRouter } from "next/navigation";
import { useUserProfileQuery } from "@/hooks/query/useUserProfileQuery";
const page = () => {
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { data: userProfile } = useUserProfileQuery(true)
  const router = useRouter();
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const { verifyEmail } = useAuthActions();
  const handleVerifyEmailSubmit = async (otp: string) => {
    try {
      console.log("Verifying OTP:", otp);
      console.log("Registered email:", registeredEmail);
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
