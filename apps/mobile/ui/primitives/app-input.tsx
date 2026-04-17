import type { ReactNode } from "react";
import type { GetProps } from "tamagui";

import { borderWidths } from "@theme/metrics";
import { typographyTokens } from "@theme/typography";
import { useState } from "react";
import { View } from "react-native";
import { Input, XStack } from "tamagui";

type AppInputProps = GetProps<typeof Input> & {
  fieldSize?: "default" | "large";
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  invalid?: boolean;
  readOnly?: boolean;
};

export function AppInput({
  fieldSize = "default",
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
  const isLarge = fieldSize === "large";
  const iconSlotStyle = {
    width: isLarge ? 28 : 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const borderColor = invalid
    ? "$borderDanger"
    : isFocused && !isReadOnly
      ? "$borderFocus"
      : isReadOnly
        ? "$borderSubtle"
        : "$borderDefault";
  const isEmphasized = (isFocused && !isReadOnly) || invalid;
  const shadowColor = invalid ? "$borderDanger" : isFocused && !isReadOnly ? "$actionPrimary" : "transparent";

  return (
    <XStack
      alignItems="center"
      backgroundColor={isReadOnly ? "$surfaceMuted" : "$surfaceDefault"}
      borderColor={borderColor}
      borderRadius={isLarge ? "$4" : "$3"}
      borderWidth={isEmphasized ? borderWidths.strong : borderWidths.subtle}
      gap="$3"
      minHeight={isLarge ? "$7" : "$6"}
      paddingHorizontal={isLarge ? "$5" : "$4"}
      shadowColor={shadowColor}
      shadowOffset={isEmphasized ? { width: 0, height: 0 } : { width: 0, height: 0 }}
      shadowOpacity={isEmphasized ? 0.14 : 0}
      shadowRadius={isEmphasized ? 10 : 0}
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
        fontSize={isLarge ? typographyTokens.body : typographyTokens.bodySmall}
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
