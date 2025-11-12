import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";

import type { AuthContextType, AuthState, User } from "@/types/AuthTypes";
import { RootStackParamList } from "@/types/navigation";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    hasSeenIntro: false,
  });
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: "your-web-client-id.googleusercontent.com", // Replace with your actual web client ID
        offlineAccess: true,
      });

      // Check if user is already signed in
      const userString = await AsyncStorage.getItem("user");
      const hasSeenIntro = await AsyncStorage.getItem("hasSeenIntro") === "true";

      if (userString) {
        const user = JSON.parse(userString);
        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: true,
          hasSeenIntro,
        });
      }
      else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          hasSeenIntro,
        }));
      }
    }
    catch (error) {
      console.log("Auth initialization error:", error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const user: User = {
        id: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.name || "",
        avatar: userInfo.user.photo || undefined,
        provider: "google",
      };

      await AsyncStorage.setItem("user", JSON.stringify(user));

      setAuthState(prev => ({
        ...prev,
        user,
        isLoading: false,
        isAuthenticated: true,
      }));

      // Navigate to main app after successful login
      navigation.replace("Main");
    }
    catch (error: any) {
      console.log("Google sign-in error:", error);
      setAuthState(prev => ({ ...prev, isLoading: false }));

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled the login flow");
      }
      else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Operation (e.g. sign in) is in progress already");
      }
      else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Lỗi", "Google Play Services không khả dụng");
      }
      else {
        Alert.alert("Lỗi", "Đăng nhập Google thất bại");
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Mock email authentication - replace with real implementation
      if (email && password.length >= 6) {
        const user: User = {
          id: Date.now().toString(),
          email,
          name: email.split("@")[0],
          provider: "email",
        };

        await AsyncStorage.setItem("user", JSON.stringify(user));

        setAuthState(prev => ({
          ...prev,
          user,
          isLoading: false,
          isAuthenticated: true,
        }));

        // Navigate to main app after successful login
        navigation.replace("Main");
      }
      else {
        throw new Error("Invalid credentials");
      }
    }
    catch (error) {
      console.log("Email sign-in error:", error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      Alert.alert("Lỗi", "Email hoặc mật khẩu không đúng");
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Mock sign up - replace with real implementation
      if (email && password.length >= 6 && name) {
        const user: User = {
          id: Date.now().toString(),
          email,
          name,
          provider: "email",
        };

        await AsyncStorage.setItem("user", JSON.stringify(user));

        setAuthState(prev => ({
          ...prev,
          user,
          isLoading: false,
          isAuthenticated: true,
        }));

        // Navigate to main app after successful login
        navigation.replace("Main");
      }
      else {
        throw new Error("Invalid data");
      }
    }
    catch (error) {
      console.log("Sign up error:", error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      Alert.alert("Lỗi", "Đăng ký thất bại. Vui lòng kiểm tra thông tin.");
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Sign out from Google if signed in with Google
      if (authState.user?.provider === "google") {
        await GoogleSignin.signOut();
      }

      await AsyncStorage.removeItem("user");

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        hasSeenIntro: authState.hasSeenIntro,
      });
    }
    catch (error) {
      console.log("Sign out error:", error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const markIntroAsSeen = async () => {
    try {
      await AsyncStorage.setItem("hasSeenIntro", "true");
      setAuthState(prev => ({ ...prev, hasSeenIntro: true }));
    }
    catch (error) {
      console.log("Mark intro as seen error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signInWithGoogle,
        signInWithEmail,
        signUp,
        signOut,
        markIntroAsSeen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
