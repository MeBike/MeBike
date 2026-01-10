import { useAuth } from "@providers/auth-providers";
import { useNavigation } from "@react-navigation/native";
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

import type { RegisterScreenNavigationProp } from "../types/navigation";
import { registerSchema } from "../schema/authSchema";

import { IconSymbol } from "../components/IconSymbol";
import { BikeColors } from "../constants/BikeColors";

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
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: BikeColors.textPrimary,
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BikeColors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: BikeColors.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  registerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: BikeColors.textSecondary,
    fontSize: 16,
  },
  loginLink: {
    color: BikeColors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 4,
  },
});

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [YOB, setYOB] = useState<string>("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, isRegistering } = useAuth();
  const isLoading = isRegistering;

  const clearForm = () => {
    setName("");
    setEmail("");
    setYOB("0")
    setPassword("");
    setConfirmPassword("");
    setPhone("");
    setErrors({});
  };
  const handleRegister = () => {
    // Validate using schema
    const validationResult = registerSchema.safeParse({
      name: name,
      email,
      YOB: Number(YOB),
      password,
      confirmPassword: confirmPassword,
      phone: phone || undefined,
    });

    if (!validationResult.success) {
      // Get all field errors
      const fieldErrors: Record<string, string> = {};
      Object.entries(validationResult.error.flatten().fieldErrors).forEach(
        ([field, messages]) => {
          if (messages && messages[0]) {
            fieldErrors[field] = messages[0];
          }
        }
      );
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    register({
      name: name,
      YOB: Number(YOB),
      email: email,
      password: password,
      confirmPassword: confirmPassword,
      phone: phone,
    }).then(() => {
      clearForm();
    }).catch((error) => {
      console.log("Register error:", error);
    });
  };

  const goToLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[BikeColors.primary, BikeColors.secondary]}
          style={styles.header}
        >
          <Pressable style={styles.backButton} onPress={goToLogin}>
            <IconSymbol name="arrow.left" size={24} color="white" />
          </Pressable>

          <View style={styles.headerContent}>
            <IconSymbol name="person.badge.plus" size={48} color="white" />
            <Text style={styles.headerTitle}>Tạo tài khoản</Text>
            <Text style={styles.headerSubtitle}>Tham gia cộng đồng MeBike</Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <View style={styles.inputWithIcon}>
                <IconSymbol
                  name="person"
                  size={20}
                  color={BikeColors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={BikeColors.textSecondary}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                  }}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>YOB</Text>
              <View style={styles.inputWithIcon}>
                <IconSymbol
                  name="birthday.cake" // Hoặc "cake" nếu muốn thân thiện
                  size={20}
                  color={BikeColors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập năm sinh (ví dụ: 1995)" // Sửa lại placeholder cho đúng
                  placeholderTextColor={BikeColors.textSecondary}
                  value={YOB}
                  onChangeText={(text) => {
                    setYOB(text); // Cập nhật state yob
                    if (errors.YOB) setErrors(prev => ({ ...prev, YOB: "" }));
                  }}
                  keyboardType="numeric" // Thêm cái này để hiện bàn phím số
                  maxLength={4} // Giới hạn 4 ký tự cho năm
                />
              </View>
              {errors.YOB && <Text style={styles.errorText}>{errors.YOB}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWithIcon}>
                <IconSymbol
                  name="envelope"
                  size={20}
                  color={BikeColors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email"
                  placeholderTextColor={BikeColors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <View style={styles.inputWithIcon}>
                <IconSymbol
                  name="phone"
                  size={20}
                  color={BikeColors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor={BikeColors.textSecondary}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                  }}
                  autoCapitalize="none"
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.inputWithIcon}>
                <IconSymbol
                  name="lock"
                  size={20}
                  color={BikeColors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={BikeColors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <IconSymbol
                    name={showPassword ? "eye.slash" : "eye"}
                    size={20}
                    color={BikeColors.textSecondary}
                  />
                </Pressable>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <View style={styles.inputWithIcon}>
                <IconSymbol
                  name="lock"
                  size={20}
                  color={BikeColors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu"
                  placeholderTextColor={BikeColors.textSecondary}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <IconSymbol
                    name={showConfirmPassword ? "eye.slash" : "eye"}
                    size={20}
                    color={BikeColors.textSecondary}
                  />
                </Pressable>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          </View>
          <Pressable
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? "Đang đăng ký..." : "Đăng ký"}
            </Text>
          </Pressable>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <Pressable onPress={goToLogin}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
