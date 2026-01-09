"use client";

import React from "react";
import { useAuth } from "@/providers/auth-providers";
import { useAuthActions } from "@/hooks/useAuthAction";
import { Progress } from "@radix-ui/react-progress";
import ChangePasswordForm from "./components/ChangePasswordForm";

export default function ChangePasswordClient() {
  const { user } = useAuth();
  const { changePassword } = useAuthActions();
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Progress />
      </div>
    );
  }
  return <ChangePasswordForm changePassword={changePassword} user={user} />;
}
