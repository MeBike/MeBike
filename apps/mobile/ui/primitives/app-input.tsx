import type { ReactNode } from "react";
import type { GetProps } from "tamagui";

import { borderWidths } from "@theme/metrics";
import { typographyTokens } from "@theme/typography";
import { useState } from "react";
import { View } from "react-native";
import { Input, XStack } from "tamagui";

type AppInputProps = GetProps<typeof Input> & {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  invalid?: boolean;
  readOnly?: boolean;
};

const iconSlotStyle = {
  width: 24,
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

export function AppInput({
  leadingIcon,
  trailingIcon,
  invalid = false,
  readOnly = false,
  onBlur,
  onFocus,
  placeholderTextColor,
  selectionColor,
  ...props
}: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isReadOnly = readOnly || props.disabled === true;

  const borderColor = invalid
    ? "$borderDanger"
    : isFocused && !isReadOnly
      ? "$borderFocus"
      : isReadOnly
        ? "$borderSubtle"
        : "$borderDefault";
  const shadowColor = invalid ? "$borderDanger" : isFocused && !isReadOnly ? "$actionPrimary" : "transparent";

  return (
    <XStack
      alignItems="center"
      backgroundColor={isReadOnly ? "$surfaceMuted" : "$surfaceDefault"}
      borderColor={borderColor}
      borderRadius="$3"
      borderWidth={isFocused && !isReadOnly || invalid ? borderWidths.strong : borderWidths.subtle}
      gap="$3"
      minHeight="$6"
      paddingHorizontal="$4"
      shadowColor={shadowColor}
      shadowOffset={isFocused && !isReadOnly || invalid ? { width: 0, height: 0 } : { width: 0, height: 0 }}
      shadowOpacity={isFocused && !isReadOnly || invalid ? 0.14 : 0}
      shadowRadius={isFocused && !isReadOnly || invalid ? 10 : 0}
    >
      {leadingIcon
        ? (
            <View style={iconSlotStyle}>
              {leadingIcon}
            </View>
          )
        : null}

      <Input
        unstyled
        color={isReadOnly ? "$textSecondary" : "$textPrimary"}
        flex={1}
        fontFamily="$body"
        fontSize={typographyTokens.bodySmall}
        fontWeight="$5"
        readOnly={isReadOnly}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        paddingVertical="$0"
        placeholderTextColor={(placeholderTextColor as any) ?? "$textTertiary"}
        selectionColor={(selectionColor as any) ?? "$actionPrimary"}
        {...props}
      />

      {trailingIcon
        ? (
            <View style={iconSlotStyle}>
              {trailingIcon}
            </View>
          )
        : null}
    </XStack>
  );
}
