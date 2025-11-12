import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { RootStackParamList } from "@/types/navigation";

import { LoadingScreen } from "./LoadingScreen";

type AuthGuardProps = {
  children: React.ReactNode;
};

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, hasSeenIntro } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        if (!hasSeenIntro) {
          navigation.navigate("Intro");
        }
        else {
          navigation.navigate("Login");
        }
      }
    }
  }, [isAuthenticated, isLoading, hasSeenIntro, navigation]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
