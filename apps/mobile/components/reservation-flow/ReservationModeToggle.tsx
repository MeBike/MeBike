import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BikeColors } from "@constants";

export type ReservationMode = "MỘT LẦN" | "GÓI THÁNG";

type ModeOption = {
  key: ReservationMode;
  title: string;
  subtitle: string;
  disabled?: boolean;
};

type Props = {
  value: ReservationMode;
  options: ModeOption[];
  onChange: (mode: ReservationMode) => void;
};

export function ReservationModeToggle({ value, options, onChange }: Props) {
  return (
    <View style={styles.wrapper}>
      {options.map((option) => {
        const isActive = option.key === value;
        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.button,
              isActive && styles.buttonActive,
              option.disabled && styles.buttonDisabled,
            ]}
            onPress={() => !option.disabled && onChange(option.key)}
            disabled={option.disabled}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.title,
                isActive && styles.titleActive,
              ]}
            >
              {option.title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                isActive && styles.subtitleActive,
              ]}
            >
              {option.subtitle}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: BikeColors.surface,
    borderWidth: 1,
    borderColor: "transparent",
  },
  buttonActive: {
    borderColor: BikeColors.primary,
    backgroundColor: "#E6F0FF",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
  },
  titleActive: {
    color: BikeColors.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: BikeColors.textSecondary,
  },
  subtitleActive: {
    color: BikeColors.primary,
  },
});
