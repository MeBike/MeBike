import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface VerifyEmailModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<void>;
  isLoading?: boolean;
}

const OTP_EXPIRY = 10 * 60; // 10 minutes in seconds
const RESEND_COOLDOWN = 60; // 1 minute cooldown

export function VerifyEmailModal({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: VerifyEmailModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY);
  const [resendTimeLeft, setResendTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!visible) {
      setOtp(["", "", "", "", "", ""]);
      setTimeLeft(OTP_EXPIRY);
      setResendTimeLeft(0);
      return;
    }
  }, [visible]);

  // Timer cho OTP expiry
  useEffect(() => {
    if (timeLeft <= 0 || !visible) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, visible]);

  // Timer cho resend cooldown
  useEffect(() => {
    if (resendTimeLeft <= 0 || !visible) return;

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
  }, [resendTimeLeft, visible]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only allow 1 character
    setOtp(newOtp);

    // Auto focus to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      Alert.alert("Error", "Vui lòng nhập đủ 6 chữ số");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(otpString);
      // Reset OTP inputs
      setOtp(["", "", "", "", "", ""]);
      // Close modal (parent will handle success UI)
      // Note: Alert already shown by onSubmit handler
    } catch (error) {
      console.log("Verify email error:", error);
      // Error alert already shown by onSubmit error handler
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Xác thực Email</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Nhập mã OTP 6 chữ số được gửi đến email của bạn
            </Text>

            {/* OTP Inputs */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    otpInputRefs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  placeholder="0"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  editable={!isSubmitting && !isLoading}
                />
              ))}
            </View>

            {/* Timer */}
            <View style={styles.timerContainer}>
              {timeLeft > 0 ? (
                <>
                  <Text style={styles.timerLabel}>Mã hết hạn trong:</Text>
                  <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
                </>
              ) : (
                <Text style={styles.timerExpired}>
                  Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.
                </Text>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || isLoading) && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Đang xác thực..." : "Xác thực"}
              </Text>
            </TouchableOpacity>

            {/* Resend Info */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendLabel}>Không nhận được mã?</Text>
              {resendTimeLeft > 0 ? (
                <Text style={styles.resendDisabled}>
                  Gửi lại trong {formatTime(resendTimeLeft)}
                </Text>
              ) : (
                <Text style={styles.resendInfo}>
                  Kiểm tra email của bạn hoặc yêu cầu gửi lại từ Profile
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "85%",
    maxWidth: 360,
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  timerLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0066FF",
  },
  timerExpired: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#0066FF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendContainer: {
    alignItems: "center",
  },
  resendLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  resendDisabled: {
    fontSize: 13,
    color: "#0066FF",
    fontWeight: "500",
  },
  resendInfo: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
});
