import { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

const styles = StyleSheet.create({
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
});

type OtpInputsProps = {
  otp: string[];
  setOtp: (otp: string[]) => void;
  isSubmitting: boolean;
  isLoading?: boolean;
};

function OtpInputs({
  otp,
  setOtp,
  isSubmitting,
  isLoading = false,
}: OtpInputsProps) {
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
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
          onChangeText={text => handleOtpChange(text, index)}
          onKeyPress={e => handleOtpKeyPress(e, index)}
          editable={!isSubmitting && !isLoading}
        />
      ))}
    </View>
  );
}

export default OtpInputs;
