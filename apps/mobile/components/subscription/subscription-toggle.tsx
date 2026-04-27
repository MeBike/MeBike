import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type SubscriptionSectionKey = "plans" | "history";

type Props = {
  active: SubscriptionSectionKey;
  historyDisabled?: boolean;
  onChange: (section: SubscriptionSectionKey) => void;
};

export function SubscriptionToggle({ active, historyDisabled = false, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Segment label="Gói tháng" isActive={active === "plans"} onPress={() => onChange("plans")} />
      <Segment
        disabled={historyDisabled}
        label="Lịch sử"
        isActive={active === "history"}
        onPress={() => onChange("history")}
      />
    </View>
  );
}

type SegmentProps = {
  label: string;
  disabled?: boolean;
  isActive: boolean;
  onPress: () => void;
};

function Segment({ label, disabled = false, isActive, onPress }: SegmentProps) {
  return (
    <TouchableOpacity
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={[styles.segment, isActive && styles.segmentActive, disabled && styles.segmentDisabled]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.segmentText, isActive && styles.segmentTextActive, disabled && styles.segmentTextDisabled]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    padding: 4,
    gap: 4,
    marginTop: 12,
  },
  segment: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "white",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  segmentDisabled: {
    opacity: 0.45,
  },
  segmentText: {
    fontWeight: "600",
    color: "#6B7280",
  },
  segmentTextActive: {
    color: "#111827",
  },
  segmentTextDisabled: {
    color: "#9CA3AF",
  },
});
