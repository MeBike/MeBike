import { log } from "@lib/log";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import OtpInputs from "./components/otp-inputs";
import { OtpResendInfo, OtpTimer } from "./components/otp-timer";
import VerifyEmailModalHeader from "./components/verify-email-modal-header";
import { useOtpTimers } from "./hooks/use-otp-timers";

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
  resendInfo: {
    marginTop: 12,
  },
});

type VerifyEmailModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<void>;
  isLoading?: boolean;
};

export function VerifyEmailModal({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}: VerifyEmailModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { timeLeft, resendTimeLeft, resetTimers } = useOtpTimers(visible);

  useEffect(() => {
    if (!visible) {
      setOtp(["", "", "", "", "", ""]);
      resetTimers();
    }
  }, [visible, resetTimers]);

  const handleSubmit = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      Alert.alert("Error", "Vui lòng nhập đủ 6 chữ số");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(otpString);
      setOtp(["", "", "", "", "", ""]);
    }
    catch (error) {
      log.error("Verify email error:", error);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <VerifyEmailModalHeader onClose={onClose} />

          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Nhập mã OTP 6 chữ số được gửi đến email của bạn
            </Text>

            <OtpInputs
              otp={otp}
              setOtp={setOtp}
              isSubmitting={isSubmitting}
              isLoading={isLoading}
            />

            <OtpTimer timeLeft={timeLeft} />

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

            <View style={styles.resendInfo}>
              <OtpResendInfo resendTimeLeft={resendTimeLeft} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default VerifyEmailModal;
