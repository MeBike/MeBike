import { router } from "expo-router";
import React, { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";

import { LoadingScreen } from "./LoadingScreen";

type AuthGuardProps = {
  children: React.ReactNode;
};

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, hasSeenIntro } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        if (!hasSeenIntro) {
          router.replace("/intro");
        }
        else {
          router.replace("/login");
        }
      }
    }
  }, [isAuthenticated, isLoading, hasSeenIntro]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
