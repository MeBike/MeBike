import type { ReactNode } from "react";
import type { TextInputProps, TextStyle } from "react-native";

import { borderWidths, radii } from "@theme/metrics";
import { useState } from "react";
import { TextInput } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

type AppComposerInputProps = Omit<TextInputProps, "style"> & {
  leadingAccessory?: ReactNode;
  trailingAccessory?: ReactNode;
};

const INPUT_TEXT_STYLE: TextStyle = {
  flex: 1,
  fontSize: 15,
  lineHeight: 22,
  maxHeight: 120,
  minHeight: 44,
  paddingLeft: 8,
  paddingBottom: 10,
  paddingTop: 10,
};

export function AppComposerInput({
  editable,
  leadingAccessory,
  onBlur,
  onFocus,
  placeholderTextColor,
  selectionColor,
  trailingAccessory,
  ...props
}: AppComposerInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const isEditable = editable ?? true;
  const borderColor = isFocused && isEditable ? "$borderFocus" : "$borderSubtle";
  const borderWidth = isFocused && isEditable ? borderWidths.strong : borderWidths.subtle;

  return (
    <XStack
      alignItems="flex-end"
      backgroundColor="$surfaceMuted"
      borderColor={borderColor}
      borderRadius={radii.xxl}
      borderWidth={borderWidth}
      gap="$2"
      minHeight={60}
      paddingHorizontal="$2"
      paddingVertical="$2"
      shadowColor={isFocused && isEditable ? "$actionPrimary" : "transparent"}
      shadowOffset={{ width: 0, height: 0 }}
      shadowOpacity={isFocused && isEditable ? 0.14 : 0}
      shadowRadius={isFocused && isEditable ? 10 : 0}
    >
      {leadingAccessory
        ? <YStack alignItems="center" height={40} justifyContent="center" width={40}>{leadingAccessory}</YStack>
        : null}

      <TextInput
        editable={isEditable}
        multiline
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={placeholderTextColor ?? theme.textSecondary.val}
        selectionColor={selectionColor ?? theme.actionPrimary.val}
        style={[INPUT_TEXT_STYLE, { color: isEditable ? theme.textPrimary.val : theme.textSecondary.val }]}
        textAlignVertical="center"
        {...props}
      />

      {trailingAccessory
        ? <YStack alignItems="center" justifyContent="flex-end" minHeight={44}>{trailingAccessory}</YStack>
        : null}
    </XStack>
  );
}
