import { AppText } from "@ui/primitives/app-text";
import { XStack, YStack } from "tamagui";

type EnvironmentDetailRowProps = {
  label: string;
  value: string;
  subValue?: string;
  tone?: "default" | "brand" | "danger" | "success";
};

export function EnvironmentDetailRow({
  label,
  value,
  subValue,
  tone = "default",
}: EnvironmentDetailRowProps) {
  return (
    <XStack alignItems="flex-start" justifyContent="space-between" minHeight={72} paddingVertical="$3">
      <AppText flex={1} numberOfLines={2} tone="muted" variant="body">
        {label}
      </AppText>
      <YStack alignItems="flex-end" flex={1} gap="$1" justifyContent="center" minHeight={40}>
        <AppText align="right" tone={tone} variant="cardTitle">
          {value}
        </AppText>
        {subValue
          ? (
              <AppText align="right" tone="subtle" variant="bodySmall">
                {subValue}
              </AppText>
            )
          : null}
      </YStack>
    </XStack>
  );
}
