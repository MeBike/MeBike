import { colors } from "@theme/colors";
import { spacing } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { StyleSheet, View } from "react-native";

import type { BackendStatus } from "../hooks/use-login";

type BackendStatusProps = {
  backendStatus: BackendStatus;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.neutralSoft,
    borderWidth: 1,
    borderColor: colors.overlayLightMuted,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

function BackendStatusIndicator({ backendStatus }: BackendStatusProps) {
  const statusText = backendStatus === "online"
    ? "Máy chủ hoạt động"
    : backendStatus === "offline"
      ? "Máy chủ offline"
      : "Đang kiểm tra máy chủ";

  const dotColor = backendStatus === "online"
    ? colors.success
    : backendStatus === "offline"
      ? colors.error
      : colors.brandAccent;

  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <AppText tone="inverted" variant="caption">{statusText}</AppText>
    </View>
  );
}

export default BackendStatusIndicator;
