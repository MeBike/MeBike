import { borderWidths, spaceScale } from "@theme/metrics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XStack, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { AppButton } from "@/ui/primitives/app-button";
import { AppText } from "@/ui/primitives/app-text";

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
      paddingTop="$4"
      paddingBottom={Math.max(insets.bottom, spaceScale[4])}
      position="absolute"
      right={0}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: -10 }}
      shadowOpacity={0.08}
      shadowRadius={24}
      elevation={10}
    >
      {actionKind === "assigned"
        ? (
            <XStack gap="$3">
              <AppButton
                buttonSize="large"
                borderColor="$dangerSoft"
                borderRadius="$5"
                borderWidth={borderWidths.subtle}
                elevation={0}
                flex={1}
                backgroundColor="$surfaceDanger"
                loading={isRejecting}
                onPress={onReject}
                pressStyle={{
                  backgroundColor: "$dangerSoft",
                  borderColor: "$dangerSoft",
                  opacity: 1,
                  scale: 0.985,
                }}
                shadowOpacity={0}
                tone="ghost"
              >
                <AppText align="center" tone="danger" variant="actionLabel">
                  Từ chối
                </AppText>
              </AppButton>

              <AppButton
                buttonSize="large"
                borderRadius="$5"
                flex={2}
                loading={isAccepting}
                onPress={onAccept}
                tone="primary"
              >
                <AppText align="center" tone="inverted" variant="actionLabel">
                  Nhận xử lý
                </AppText>
              </AppButton>
            </XStack>
          )
        : null}

      {actionKind === "accepted"
        ? (
            <AppButton
              buttonSize="large"
              backgroundColor="$surfaceInverse"
              borderColor="$surfaceInverse"
              borderRadius="$5"
              loading={isStarting}
              onPress={onStart}
              pressStyle={{
                backgroundColor: "$textPrimary",
                borderColor: "$textPrimary",
                opacity: 1,
                scale: 0.985,
              }}
              tone="primary"
              width="100%"
            >
              <AppText align="center" tone="inverted" variant="actionLabel">
                Bắt đầu xử lý
              </AppText>
            </AppButton>
          )
        : null}

      {actionKind === "in_progress"
        ? (
            <AppButton
              buttonSize="large"
              backgroundColor="$statusSuccess"
              borderColor="$statusSuccess"
              borderRadius="$5"
              loading={isResolving}
              onPress={onResolve}
              pressStyle={{
                backgroundColor: "$textSuccess",
                borderColor: "$textSuccess",
                opacity: 1,
                scale: 0.985,
              }}
              tone="primary"
              width="100%"
            >
              <XStack alignItems="center" gap="$2">
                <IconSymbol color="#FFFFFF" name="check-circle" size="sm" />
                <AppText align="center" tone="inverted" variant="actionLabel">
                  Hoàn tất sự cố
                </AppText>
              </XStack>
            </AppButton>
          )
        : null}
    </YStack>
  );
}
