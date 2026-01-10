import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@providers/auth-providers";

import type { ForgotPasswordNavigationProp } from "../types/navigation";

import { IconSymbol } from "../components/IconSymbol";
import { BikeColors } from "@constants";

function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [email, setEmail] = useState<string>("");
  const { forgotPassword, isLoadingForgottingPassword } = useAuth();
  
  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert("Lỗi", "Vui lòng nhập email");
      return;
    }
    
    forgotPassword({ email });
    
    // Navigate to OTP verification screen after sending email
    setTimeout(() => {
      navigation.navigate("ResetPasswordOTP", {
        email,
      });
    }, 500);
  };

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
          colors={[BikeColors.primary, BikeColors.secondary]}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
            <Text style={styles.headerSubtitle}>
              Vui lòng nhập thông tin để đổi mật khẩu
            </Text>
          </View>
        </LinearGradient>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập email"
              placeholderTextColor={BikeColors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Pressable style={styles.button} onPress={() => handleForgotPassword()}>
            <Text style={styles.buttonText}>Xác nhận</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    position: "relative",
  },
  backButton: {
    padding: 8,
    marginBottom: 12,
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
    fontSize: 16,
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
  button: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default ForgotPasswordScreen;
