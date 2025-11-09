import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { IconSymbol } from "../components/IconSymbol";
import { BikeColors } from "../constants/BikeColors";
import { useAuth } from "@providers/auth-providers";

type ResetPasswordFormRouteProp = RouteProp<
  RootStackParamList,
  "ResetPasswordForm"
>;

type ResetPasswordFormNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ResetPasswordForm"
>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
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
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: BikeColors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BikeColors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: BikeColors.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },
  button: {
    backgroundColor: BikeColors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  validationText: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 4,
  },
});

export default function ResetPasswordFormScreen() {
  const navigation = useNavigation<ResetPasswordFormNavigationProp>();
  const route = useRoute<ResetPasswordFormRouteProp>();
  const { email, otp } = route.params;
  const { resetPassword, isReseting } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isPasswordValid = newPassword.length >= 8;
  const isPasswordMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isFormValid = isPasswordValid && isPasswordMatch;
  const handleResetPassword = async () => {
    if (!isFormValid) {
      Alert.alert("Lỗi", "Vui lòng kiểm tra mật khẩu");
      return;
    }

    try {
      await resetPassword({
        password: newPassword,
        confirm_password: confirmPassword,
        forgot_password_token: otp,
        email,
        otp,
      });
      // resetPassword already navigates to Login on success
    } catch (error) {
      console.log("Reset password error:", error);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[BikeColors.secondary, BikeColors.primary]}
          style={[styles.header, { paddingTop: insets.top + 32 }]}
        >
          <View style={styles.headerContent}>
            <IconSymbol
              name="lock"
              size={40}
              color="white"
            />
            <Text style={styles.headerTitle}>Đặt lại mật khẩu</Text>
            <Text style={styles.headerSubtitle}>
              Tạo mật khẩu mới cho tài khoản của bạn
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          {/* New Password */}
          <Text style={styles.inputLabel}>Mật khẩu mới</Text>
          <View style={styles.inputContainer}>
            <IconSymbol
              name="lock"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu mới"
              placeholderTextColor={BikeColors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <IconSymbol
                name={showPassword ? "eye.slash" : "eye"}
                size={20}
                color={BikeColors.textSecondary}
              />
            </Pressable>
          </View>
          {newPassword && (
            <Text
              style={[
                isPasswordValid ? styles.validationText : styles.errorText,
              ]}
            >
              {isPasswordValid
                ? "✓ Mật khẩu có ít nhất 8 ký tự"
                : "✗ Mật khẩu phải có ít nhất 8 ký tự"}
            </Text>
          )}

          {/* Confirm Password */}
          <Text style={[styles.inputLabel, { marginTop: 16 }]}>
            Xác nhận mật khẩu
          </Text>
          <View style={styles.inputContainer}>
            <IconSymbol
              name="lock"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor={BikeColors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <IconSymbol
                name={showConfirmPassword ? "eye.slash" : "eye"}
                size={20}
                color={BikeColors.textSecondary}
              />
            </Pressable>
          </View>
          {confirmPassword && (
            <Text
              style={[
                isPasswordMatch ? styles.validationText : styles.errorText,
              ]}
            >
              {isPasswordMatch
                ? "✓ Mật khẩu khớp"
                : "✗ Mật khẩu không khớp"}
            </Text>
          )}

          {/* Submit Button */}
          <Pressable
            style={[
              styles.button,
              (!isFormValid || isReseting) && styles.disabledButton,
            ]}
            onPress={handleResetPassword}
            disabled={!isFormValid || isReseting}
          >
            <Text style={styles.buttonText}>
              {isReseting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
