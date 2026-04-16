import { IconSymbol } from "@components/IconSymbol";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { ActivityIndicator } from "react-native";
import { useTheme, YStack } from "tamagui";

type EnvironmentScreenStateProps = {
  title: string;
  description: string;
  onRetry?: () => void;
  mode?: "loading" | "error";
};

export function EnvironmentScreenState({
  title,
  description,
  onRetry,
  mode = "error",
}: EnvironmentScreenStateProps) {
  const theme = useTheme();

  return (
    <YStack flex={1} justifyContent="center" padding="$5">
      <AppCard alignItems="center" borderRadius="$5" gap="$4" padding="$6">
        <YStack
          alignItems="center"
          backgroundColor="$surfaceAccent"
          borderRadius="$round"
          height={64}
          justifyContent="center"
          width={64}
        >
          {mode === "loading"
            ? <ActivityIndicator color={theme.actionPrimary.val} size="large" />
            : <IconSymbol color={theme.actionPrimary.val} name="warning" size="chip" />}
        </YStack>

        <YStack alignItems="center" gap="$2">
          <AppText align="center" variant="headline">
            {title}
          </AppText>
          <AppText align="center" tone="muted" variant="bodySmall">
            {description}
          </AppText>
        </YStack>

        {mode === "error" && onRetry
          ? (
              <AppButton onPress={onRetry} width="100%">
                Thử lại
              </AppButton>
            )
          : null}
      </AppCard>
    </YStack>
  );
}
