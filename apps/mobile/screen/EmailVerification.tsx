import { useAuth } from "@providers/auth-providers";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
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

import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { IconSymbol } from "../components/IconSymbol";
import { BikeColors } from "../constants/BikeColors";

type EmailVerificationRouteProp = RouteProp<
  RootStackParamList,
  "EmailVerification"
>;

type EmailVerificationNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EmailVerification"
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
    fontSize: 14,
    color: BikeColors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: BikeColors.lightGray,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  verifyButton: {
    backgroundColor: BikeColors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: BikeColors.textSecondary,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: BikeColors.secondary,
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  resendButtonText: {
    color: BikeColors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  resendButtonTextDisabled: {
    color: BikeColors.lightGray,
    fontSize: 16,
    fontWeight: "600",
  },
  skipContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  skipText: {
    color: BikeColors.textSecondary,
    fontSize: 14,
  },
  skipLink: {
    color: BikeColors.secondary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});

const OTP_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const OTP_EXPIRY = 10 * 60; // 10 minutes in seconds
const RESEND_COOLDOWN = 10 * 60; // 10 minutes in seconds

export default function EmailVerificationScreen() {
  const navigation = useNavigation<EmailVerificationNavigationProp>();
  const route = useRoute<EmailVerificationRouteProp>();
  const { email } = route.params;

  const { verifyEmail, resendVerifyEmail } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY);
  const [resendTimeLeft, setResendTimeLeft] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // Timer cho OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          Alert.alert("Lỗi", "Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.");
          setOtp(["", "", "", "", "", ""]);
          setResendTimeLeft(RESEND_COOLDOWN);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Timer cho resend cooldown
  useEffect(() => {
    if (resendTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setResendTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimeLeft]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Chỉ lấy ký tự cuối cùng
    setOtp(newOtp);

    // Auto focus sang input tiếp theo
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ 6 ký tự OTP");
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmail({ email, otp: otpCode });
      Alert.alert("Thành công", "Email đã được xác nhận");
      navigation.navigate("Main");
    } catch (error) {
      console.log("Verify error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimeLeft > 0) return;

    try {
      await resendVerifyEmail();
      Alert.alert("Thành công", "Mã OTP đã được gửi lại");
      setTimeLeft(OTP_EXPIRY);
      setResendTimeLeft(RESEND_COOLDOWN);
      setOtp(["", "", "", "", "", ""]);
    } catch (error) {
      console.log("Resend error:", error);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Bỏ qua xác nhận",
      "Bạn chắc chắn muốn bỏ qua xác nhận email? Bạn có thể xác nhận sau.",
      [
        { text: "Không", onPress: () => {} },
        {
          text: "Có, bỏ qua",
          onPress: () => {
            navigation.navigate("Main");
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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
              name="envelope.open"
              size={60}
              color={BikeColors.secondary}
            />
            <Text style={styles.logoText}>Xác nhận Email</Text>
            <Text style={styles.subtitle}>
              Chúng tôi đã gửi mã OTP đến {"\n"}
              {email}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 16 }}>
            Nhập mã OTP (6 chữ số)
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((value, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  otpInputRefs.current[index] = ref;
                }}
                style={styles.otpInput}
                value={value}
                onChangeText={(text) => handleOtpChange(text, index)}
                keyboardType="number-pad"
                maxLength={1}
                editable={timeLeft > 0}
              />
            ))}
          </View>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              Mã OTP sẽ hết hạn trong
            </Text>
            <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
          </View>

          <Pressable
            style={[
              styles.verifyButton,
              (isVerifying || timeLeft <= 0) && styles.disabledButton,
            ]}
            onPress={handleVerifyOtp}
            disabled={isVerifying || timeLeft <= 0}
          >
            <Text style={styles.verifyButtonText}>
              {isVerifying ? "Đang xác nhận..." : "Xác nhận"}
            </Text>
          </Pressable>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              Không nhận được mã OTP?
            </Text>
          </View>

          <Pressable
            style={styles.resendButton}
            onPress={handleResendOtp}
            disabled={resendTimeLeft > 0}
          >
            <Text
              style={
                resendTimeLeft > 0
                  ? styles.resendButtonTextDisabled
                  : styles.resendButtonText
              }
            >
              {resendTimeLeft > 0
                ? `Gửi lại trong ${formatTime(resendTimeLeft)}`
                : "Gửi lại mã OTP"}
            </Text>
          </Pressable>

          <View style={styles.skipContainer}>
            <Text style={styles.skipText}>Muốn bỏ qua?</Text>
            <Pressable onPress={handleSkip}>
              <Text style={styles.skipLink}>Tiếp tục sau</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
