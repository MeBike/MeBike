import type { ReactNode } from "react";
import type { GetProps } from "tamagui";

import { colors } from "@theme/colors";
import { fontSizes, fontWeights } from "@theme/typography";
import { useState } from "react";
import { View } from "react-native";
import { Input, XStack } from "tamagui";

type AppInputProps = GetProps<typeof Input> & {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  invalid?: boolean;
};

export function AppInput({
  leadingIcon,
  trailingIcon,
  invalid = false,
  onBlur,
  onFocus,
  placeholderTextColor = "$textSecondary",
  selectionColor = "$brandPrimary",
  ...props
}: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = invalid ? "$error" : isFocused ? "$brandPrimary" : "$borderSubtle";

  return (
    <XStack
      alignItems="center"
      backgroundColor="$backgroundStrong"
      borderColor={borderColor}
      borderRadius="$3"
      borderWidth={isFocused || invalid ? 2 : 1}
      gap="$3"
      minHeight={52}
      paddingLeft={16}
      paddingRight={14}
      shadowColor={isFocused && !invalid ? colors.brandPrimary : "transparent"}
      shadowOffset={isFocused && !invalid ? { width: 0, height: 0 } : undefined}
      shadowOpacity={isFocused && !invalid ? 0.16 : 0}
      shadowRadius={isFocused && !invalid ? 10 : 0}
    >
      {leadingIcon
        ? (
            <View
              style={{
                width: 24,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {leadingIcon}
            </View>
          )
        : null}
      <Input
        unstyled
        color="$textPrimary"
        flex={1}
        fontFamily="$body"
        fontSize={fontSizes.base}
        fontWeight={fontWeights.medium}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        paddingVertical={0}
        placeholderTextColor={placeholderTextColor as any}
        selectionColor={selectionColor as any}
        {...props}
      />
      {trailingIcon
        ? (
            <View
              style={{
                width: 24,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {trailingIcon}
            </View>
          )
        : null}
    </XStack>
  );
}
