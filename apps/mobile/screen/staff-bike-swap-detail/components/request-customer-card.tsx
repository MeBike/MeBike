import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import { getBikeSwapRequestCode } from "@/screen/staff-bike-swap/shared";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";

type RequestCustomerCardProps = {
  rentalId: string;
  user: {
    fullName: string;
    id: string;
  };
};

type ValueRowProps = {
  iconName: "person" | "qr-code";
  label?: string;
  subtitle?: string;
  value: string;
  valueVariant?: "bodyStrong" | "subhead";
};

function ValueRow({
  iconName,
  label,
  subtitle,
  value,
  valueVariant = "bodyStrong",
}: ValueRowProps) {
  const theme = useTheme();

  return (
    <XStack alignItems="center" gap="$3">
      <YStack
        alignItems="center"
        backgroundColor="$surfaceAccent"
        borderRadius="$round"
        height={48}
        justifyContent="center"
        width={48}
      >
        <IconSymbol color={theme.textTertiary.val} name={iconName} size="md" />
      </YStack>

      <YStack flex={1} gap="$1">
        {label
          ? (
              <AppText tone="muted" variant="bodySmall">
                {label}
              </AppText>
            )
          : null}
        <AppText numberOfLines={1} variant={valueVariant}>
          {value}
        </AppText>
        {subtitle
          ? (
              <AppText numberOfLines={1} tone="muted" variant="bodySmall">
                {subtitle}
              </AppText>
            )
          : null}
      </YStack>
    </XStack>
  );
}

export function RequestCustomerCard({ rentalId, user }: RequestCustomerCardProps) {
  return (
    <AppCard borderRadius={32} chrome="whisper" gap="$4" padding="$4">
      <ValueRow
        iconName="person"
        subtitle={getBikeSwapRequestCode(user.id)}
        value={user.fullName}
        valueVariant="subhead"
      />

      <YStack borderTopColor="$borderSubtle" borderTopWidth={1} paddingTop="$4">
        <ValueRow
          iconName="qr-code"
          label="Mã phiên thuê gốc"
          value={getBikeSwapRequestCode(rentalId)}
        />
      </YStack>
    </AppCard>
  );
}
