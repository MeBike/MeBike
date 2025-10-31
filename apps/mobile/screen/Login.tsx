import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@providers/auth-providers";

import type { LoginScreenNavigationProp } from "../types/navigation";

import { IconSymbol } from "../components/IconSymbol";
import { BikeColors } from "../constants/BikeColors";
import { testBackendConnection } from "../utils/testConnection";

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const rotateAnim = new Animated.Value(0);
  const { logIn, isLoggingIn, isLoading, forgotPassword, isLoadingForgottingPassword } = useAuth();

  useEffect(() => {
    const checkBackend = async () => {
      const isOnline = await testBackendConnection();
      setBackendStatus(isOnline ? "online" : "offline");
    };
    checkBackend();
  }, []);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    // if (backendStatus === "offline") {
    //   Alert.alert("Lỗi kết nối", "Không thể kết nối đến server. Vui lòng kiểm tra:\n\n1. Server backend có đang chạy?\n2. URL API có đúng không?\n3. Kết nối mạng", [
    //     {
    //       text: "Thử lại",
    //       onPress: async () => {
    //         setBackendStatus("checking");
    //         const isOnline = await testBackendConnection();
    //         setBackendStatus(isOnline ? "online" : "offline");
    //       },
    //     },
    //     {
    //       text: "Demo Mode",
    //       onPress: () => navigation.navigate("StationSelect"),
    //     },
    //   ]);
    //   return;
    // }
    try {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();

      logIn({ email, password });
      // setTimeout(() => {
      //   rotateAnim.stopAnimation();
      //   rotateAnim.setValue(0);
      //   navigation.navigate("Main");
      // }, 500);
    }
    catch (error) {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
      console.log("Login failed:", error);
    }
  };
  const goToRegister = () => {
    navigation.navigate("Register");
  };

  const goBack = () => {
    navigation.goBack();
  };
  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[BikeColors.primary, BikeColors.secondary]}
          style={styles.header}
        >
          <Pressable style={styles.backButton} onPress={goBack}>
            <IconSymbol name="arrow.left" size={24} color="white" />
          </Pressable>

          <View style={styles.headerContent}>
            <IconSymbol name="bicycle" size={48} color="white" />
            <Text style={styles.headerTitle}>Đăng nhập</Text>
            <Text style={styles.headerSubtitle}>Chào mừng bạn trở lại!</Text>

            {/* Backend Status Indicator */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor:
                backendStatus === "online"
                  ? "#4CAF50"
                  : backendStatus === "offline" ? "#F44336" : "#FF9800" }]}
              />
              <Text style={styles.statusText}>
                Server:
                {" "}
                {
                  backendStatus === "online"
                    ? "Hoạt động"
                    : backendStatus === "offline" ? "Offline" : "Đang kiểm tra..."
                }
              </Text>
            </View>
          </View>
        </LinearGradient>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email của bạn"
              placeholderTextColor={BikeColors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu"
              placeholderTextColor={BikeColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Pressable style={styles.forgotPassword} onPress={() => handleForgotPassword()}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </Pressable>

          <Pressable
            style={[styles.loginButton, isLoggingIn && styles.disabledButton]}
            onPress={handleEmailLogin}
            disabled={isLoggingIn && isLoading}
          >
            <Animated.View
              style={{
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                }],
              }}
            >
              <Text style={styles.loginButtonText}>
                {isLoggingIn ? "Đang đăng nhập..." : "Đăng nhập"}
              </Text>
            </Animated.View>
          </Pressable>
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <Pressable onPress={goToRegister}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    padding: 8,
    marginBottom: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: BikeColors.divider,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: BikeColors.textPrimary,
    backgroundColor: "white",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: BikeColors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BikeColors.divider,
  },
  dividerText: {
    marginHorizontal: 16,
    color: BikeColors.textSecondary,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BikeColors.divider,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  googleButtonText: {
    color: BikeColors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    color: BikeColors.textSecondary,
    fontSize: 16,
  },
  registerLink: {
    color: BikeColors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
