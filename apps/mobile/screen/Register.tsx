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

import { useAuth } from "@providers/auth-providers";

import type { RegisterScreenNavigationProp } from "../types/navigation";

import { IconSymbol } from "../components/IconSymbol";
import { BikeColors } from "../constants/BikeColors";

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const { register, isRegistering, logIn } = useAuth();
  const isLoading = isRegistering;

  const clearForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhone("");
  };
  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !phone) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    register({
      fullname: name,
      email,
      password,
      confirm_password: confirmPassword,
      phone_number: phone,
    });
    clearForm();
    setTimeout(() => {
      navigation.navigate("Main");
    }, 1000);
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
    }
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
          colors={[`${BikeColors.secondary}10`, "white"]}
          style={styles.header}
        >
          <View style={styles.logoContainer}>
            <IconSymbol
              name="person.badge.plus"
              size={60}
              color={BikeColors.secondary}
            />
            <Text style={styles.logoText}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Tham gia cộng đồng BikeShare</Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <IconSymbol
              name="person"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <IconSymbol
              name="envelope"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.inputContainer}>
            <IconSymbol
              name="phone"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <IconSymbol
              name="lock"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              value={password}
              onChangeText={setPassword}
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

          <View style={styles.inputContainer}>
            <IconSymbol
              name="lock"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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

          <Pressable
            style={[styles.registerButton, isLoading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? "Đang đăng ký..." : "Đăng ký"}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

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
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: BikeColors.secondary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: BikeColors.textSecondary,
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BikeColors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
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
  registerButton: {
    backgroundColor: BikeColors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BikeColors.lightGray,
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
    borderColor: BikeColors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
  },
  googleButtonText: {
    color: BikeColors.secondary,
    fontSize: 16,
    fontWeight: "500",
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
    color: BikeColors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
});
