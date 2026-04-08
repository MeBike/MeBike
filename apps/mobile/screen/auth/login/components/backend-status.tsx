import { StyleSheet, View } from "react-native";
import { useTheme } from "tamagui";

import { spaceScale } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

import type { BackendStatus } from "../hooks/use-login";

type BackendStatusProps = {
  backendStatus: BackendStatus;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spaceScale[2],
    paddingHorizontal: spaceScale[2],
    paddingVertical: spaceScale[1],
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

function BackendStatusIndicator({ backendStatus }: BackendStatusProps) {
  const theme = useTheme();
  const statusText = backendStatus === "online"
    ? "Máy chủ hoạt động"
    : backendStatus === "offline"
      ? "Máy chủ offline"
      : "Đang kiểm tra máy chủ";

  const dotColor = backendStatus === "online"
    ? theme.statusSuccess.val
    : backendStatus === "offline"
      ? theme.statusDanger.val
      : theme.actionAccent.val;

  return (
    <View style={[styles.badge, { backgroundColor: theme.surfaceMuted.val, borderColor: theme.overlayGlassMuted.val }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <AppText tone="inverted" variant="caption">{statusText}</AppText>
    </View>
  );
}

export default BackendStatusIndicator;
