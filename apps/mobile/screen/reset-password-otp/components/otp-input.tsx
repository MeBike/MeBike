import { BikeColors } from "@constants/BikeColors";
import { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

const styles = StyleSheet.create({
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
    borderColor: BikeColors.divider,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: BikeColors.textPrimary,
    backgroundColor: "white",
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
});

type OtpInputProps = {
  otp: string[];
  disabled: boolean;
  onChangeDigit: (index: number, value: string) => void;
};

export function OtpInput({ otp, disabled, onChangeDigit }: OtpInputProps) {
  const refs = useRef<Array<TextInput | null>>([]);

  return (
    <View style={styles.otpContainer}>
      {otp.map((value, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            refs.current[index] = ref;
          }}
          style={[styles.otpInput, disabled && styles.otpInputDisabled]}
          value={value}
          onChangeText={(text) => {
            onChangeDigit(index, text);
            if (text && index < otp.length - 1) {
              refs.current[index + 1]?.focus();
            }
          }}
          keyboardType="number-pad"
          maxLength={1}
          editable={!disabled}
        />
      ))}
    </View>
  );
}
