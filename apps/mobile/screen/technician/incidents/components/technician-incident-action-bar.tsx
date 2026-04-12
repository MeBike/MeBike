import { borderWidths, spaceScale } from "@theme/metrics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

import { AppButton } from "@/ui/primitives/app-button";

type TechnicianIncidentActionBarProps = {
  actionKind: "assigned" | "accepted" | "in_progress" | null;
  isAccepting: boolean;
  isRejecting: boolean;
  isResolving: boolean;
  isStarting: boolean;
  onAccept: () => void;
  onLayout?: (height: number) => void;
  onReject: () => void;
  onResolve: () => void;
  onStart: () => void;
};

export function TechnicianIncidentActionBar({
  actionKind,
  isAccepting,
  isRejecting,
  isResolving,
  isStarting,
  onAccept,
  onLayout,
  onReject,
  onResolve,
  onStart,
}: TechnicianIncidentActionBarProps) {
  const insets = useSafeAreaInsets();

  if (!actionKind) {
    return null;
  }

  return (
    <YStack
      backgroundColor="$surfaceDefault"
      borderTopColor="$borderSubtle"
      borderTopWidth={borderWidths.subtle}
      bottom={0}
      gap="$3"
      left={0}
      onLayout={(event) => {
        onLayout?.(event.nativeEvent.layout.height);
      }}
      paddingHorizontal="$4"
      paddingTop="$3"
      paddingBottom={Math.max(insets.bottom, spaceScale[4])}
      position="absolute"
      right={0}
    >
      {actionKind === "assigned"
        ? (
            <XStack gap="$3">
              <AppButton
                buttonSize="large"
                flex={1}
                loading={isRejecting}
                onPress={onReject}
                tone="danger"
              >
                Từ chối
              </AppButton>

              <AppButton
                buttonSize="large"
                flex={2}
                loading={isAccepting}
                onPress={onAccept}
                tone="primary"
              >
                Nhận xử lý
              </AppButton>
            </XStack>
          )
        : null}

      {actionKind === "accepted"
        ? (
            <AppButton
              buttonSize="large"
              loading={isStarting}
              onPress={onStart}
              tone="primary"
              width="100%"
            >
              Bắt đầu xử lý
            </AppButton>
          )
        : null}

      {actionKind === "in_progress"
        ? (
            <AppButton
              buttonSize="large"
              loading={isResolving}
              onPress={onResolve}
              tone="primary"
              width="100%"
            >
              Hoàn tất sự cố
            </AppButton>
          )
        : null}
    </YStack>
  );
}
