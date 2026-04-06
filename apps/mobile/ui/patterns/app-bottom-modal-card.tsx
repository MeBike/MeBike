import type { ReactNode } from "react";

import { Modal, Pressable } from "react-native";
import { useTheme } from "tamagui";

import { elevations } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";

type AppBottomModalCardProps = {
  children: ReactNode;
  isVisible: boolean;
  onClose: () => void;
};

export function AppBottomModalCard({ children, isVisible, onClose }: AppBottomModalCardProps) {
  const theme = useTheme();

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isVisible}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: theme.overlayScrim.val,
          justifyContent: "flex-end",
        }}
      >
        <Pressable onPress={() => {}}>
          <AppCard
            borderRadius="$5"
            chrome="flat"
            margin="$4"
            overflow="hidden"
            padding="$0"
            style={elevations.medium}
          >
            {children}
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
