import React, { useState } from "react";
import { Pressable } from "react-native";
import { Input, XStack, useTheme } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { borderWidths } from "@/theme/metrics";

type SearchCardProps = {
  onBack: () => void;
  onClear: () => void;
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  onSubmit: () => void;
};

export function SearchCard({
  onBack,
  onClear,
  phoneNumber,
  onPhoneChange,
  onSubmit,
}: SearchCardProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = isFocused ? "$actionPrimary" : "$borderDefault";

  return (
    <XStack alignItems="center" gap="$3" paddingHorizontal="$4">
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={onBack}
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconSymbol color={theme.textSecondary.val} name="arrow.left" size={24} />
      </Pressable>

      <XStack
        alignItems="center"
        backgroundColor="$backgroundRaised"
        borderColor={borderColor}
        borderRadius="$round"
        borderWidth={isFocused ? borderWidths.strong : borderWidths.subtle}
        flex={1}
        gap="$3"
        minHeight={60}
        paddingHorizontal="$4"
      >
        <IconSymbol color={theme.textTertiary.val} name="magnifyingglass" size={22} />

        <Input
          autoFocus
          color="$textPrimary"
          flex={1}
          fontFamily="$body"
          fontSize="$8"
          fontWeight="$6"
          keyboardType="phone-pad"
          maxLength={15}
          onBlur={() => setIsFocused(false)}
          onChangeText={onPhoneChange}
          onFocus={() => setIsFocused(true)}
          onSubmitEditing={onSubmit}
          placeholder="Nhập SĐT khách"
          placeholderTextColor="$textTertiary"
          returnKeyType="search"
          selectionColor="$actionPrimary"
          unstyled
          value={phoneNumber}
        />

        {phoneNumber.trim().length > 0
          ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={6}
                onPress={onClear}
                style={{
                  width: 28,
                  height: 28,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol color={theme.textTertiary.val} name="xmark" size={18} />
              </Pressable>
            )
          : null}
      </XStack>
    </XStack>
  );
}
