import { useAuth } from "@providers/auth-providers";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
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
import { registerSchema, RegisterSchemaFormData } from "../schema/authSchema";

import { IconSymbol } from "../components/IconSymbol";
import { BikeColors } from "../constants/BikeColors";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
  inputWithIconError: {
    borderColor: "#EF4444",
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isRegistering } = useAuth();
  const isLoading = isRegistering;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterSchemaFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      YOB: undefined,
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: RegisterSchemaFormData) => {
    register({
      name: data.name,
      YOB: Number(data.YOB),
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      phone: data.phone,
    })
      .then(() => {
        reset();
        navigation.navigate("Main");
      })
      .catch((error) => {
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
          {/* Họ và tên */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWithIcon, errors.name && styles.inputWithIconError]}>
                  <IconSymbol
                    name="person"
                    size={20}
                    color={BikeColors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập họ và tên"
                    placeholderTextColor={BikeColors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="words"
                  />
                </View>
              )}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWithIcon, errors.email && styles.inputWithIconError]}>
                  <IconSymbol
                    name="envelope"
                    size={20}
                    color={BikeColors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập email"
                    placeholderTextColor={BikeColors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          {/* Năm sinh */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Năm sinh</Text>
            <Controller
              control={control}
              name="YOB"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWithIcon, errors.YOB && styles.inputWithIconError]}>
                  <IconSymbol
                    name="birthday.cake"
                    size={20}
                    color={BikeColors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ví dụ: 2000"
                    placeholderTextColor={BikeColors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                    value={value ? value.toString() : ""}
                    autoCapitalize="none"
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              )}
            />
            {errors.YOB && <Text style={styles.errorText}>{errors.YOB.message}</Text>}
          </View>

          {/* Số điện thoại */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWithIcon, errors.phone && styles.inputWithIconError]}>
                  <IconSymbol
                    name="phone"
                    size={20}
                    color={BikeColors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor={BikeColors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    keyboardType="phone-pad"
                  />
                </View>
              )}
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone.message}</Text>
            )}
          </View>

          {/* Mật khẩu */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWithIcon, errors.password && styles.inputWithIconError]}>
                  <IconSymbol
                    name="lock"
                    size={20}
                    color={BikeColors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu"
                    placeholderTextColor={BikeColors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
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
              )}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>

          {/* Xác nhận mật khẩu */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputWithIcon, errors.confirmPassword && styles.inputWithIconError]}>
                  <IconSymbol
                    name="lock"
                    size={20}
                    color={BikeColors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Xác nhận mật khẩu"
                    placeholderTextColor={BikeColors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
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
              )}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
            )}
          </View>

          <Pressable
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit(onSubmit)}
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
