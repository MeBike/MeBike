import { colors } from "@theme/colors";
import { radii, spacing } from "@theme/metrics";
import { fontSizes, fontWeights } from "@theme/typography";
import { useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

type OtpCodeInputProps = {
  otp: string[];
  disabled?: boolean;
  onChangeDigit: (index: number, value: string) => void;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    textAlign: "center",
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundStrong,
  },
  inputDisabled: {
    opacity: 0.6,
  },
});

export function OtpCodeInput({ otp, disabled = false, onChangeDigit }: OtpCodeInputProps) {
  const refs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);

  return (
    <View style={styles.container}>
      {otp.map((value, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            refs.current[index] = ref;
          }}
          editable={!disabled}
          keyboardType="number-pad"
          maxLength={1}
          onBlur={() => {
            setFocusedIndex(current => (current === index ? null : current));
          }}
          onChangeText={(text) => {
            onChangeDigit(index, text);
            if (text && index < otp.length - 1) {
              refs.current[index + 1]?.focus();
            }
          }}
          onFocus={() => {
            setFocusedIndex(index);
          }}
          style={[
            styles.input,
            (focusedIndex === index || value) && !disabled
              ? {
                  borderColor: colors.brandPrimary,
                  borderWidth: 2,
                }
              : null,
            disabled && styles.inputDisabled,
          ]}
          value={value}
        />
      ))}
    </View>
  );
}
