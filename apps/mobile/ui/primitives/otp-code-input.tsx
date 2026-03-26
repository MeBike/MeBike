import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { useTheme } from "tamagui";

import { radii, spaceScale } from "@theme/metrics";
import { fontSizes, fontWeights } from "@theme/typography";

type OtpCodeInputProps = {
  otp: string[];
  disabled?: boolean;
  onChangeDigit: (index: number, value: string) => void;
};

export function OtpCodeInput({ otp, disabled = false, onChangeDigit }: OtpCodeInputProps) {
  const theme = useTheme();
  const refs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spaceScale[2] }}>
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
            {
              flex: 1,
              height: 56,
              borderWidth: 1,
              borderColor: theme.borderSubtle.val,
              borderRadius: radii.md,
              textAlign: "center",
              fontSize: fontSizes.lg,
              fontWeight: fontWeights.semibold,
              color: theme.textPrimary.val,
              backgroundColor: theme.backgroundRaised.val,
            },
            (focusedIndex === index || value) && !disabled
              ? {
                  borderColor: theme.actionPrimary.val,
                  borderWidth: 2,
                }
              : null,
            disabled && { opacity: 0.6 },
          ]}
          value={value}
        />
      ))}
    </View>
  );
}
