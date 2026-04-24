import { Pressable, StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
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
  resendButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#0066FF",
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    fontSize: 13,
    color: "white",
    fontWeight: "600",
  },
});

type OtpTimerProps = {
  timeLeft: number;
  resendTimeLeft: number;
};

export function OtpTimer({ timeLeft }: { timeLeft: number }) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.timerContainer}>
      {timeLeft > 0
        ? (
            <>
              <Text style={styles.timerLabel}>Mã hết hạn trong:</Text>
              <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
            </>
          )
        : (
            <Text style={styles.timerExpired}>
              Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.
            </Text>
          )}
    </View>
  );
}

export function OtpResendInfo({
  resendTimeLeft,
  onResend,
  isResending = false,
}: {
  resendTimeLeft: number;
  onResend?: () => void;
  isResending?: boolean;
}) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.resendContainer}>
      <Text style={styles.resendLabel}>Không nhận được mã?</Text>
      {resendTimeLeft > 0
        ? (
            <Text style={styles.resendDisabled}>
              Gửi lại trong
              {" "}
              {formatTime(resendTimeLeft)}
            </Text>
          )
        : (
            <Pressable
              disabled={!onResend || isResending}
              onPress={onResend}
              style={({ pressed }) => [
                styles.resendButton,
                (!onResend || isResending) && styles.resendButtonDisabled,
                pressed && onResend && !isResending ? { opacity: 0.9 } : null,
              ]}
            >
              <Text style={styles.resendButtonText}>
                {isResending ? "Đang gửi mã..." : "Gửi lại mã"}
              </Text>
            </Pressable>
          )}
    </View>
  );
}

export default function OtpTimerComponent({
  timeLeft,
  resendTimeLeft,
}: OtpTimerProps) {
  return (
    <>
      <OtpTimer timeLeft={timeLeft} />
      <OtpResendInfo resendTimeLeft={resendTimeLeft} />
    </>
  );
}
