import type { ReactNode } from "react";

import { Linking, Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { RentalDetail } from "@/types/rental-types";

import { IconSymbol } from "@/components/IconSymbol";
import { borderWidths, elevations } from "@/theme/metrics";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { getBikeChipDisplay } from "@/utils/bike";
import { formatSupportCode } from "@/utils/id";

type StaffPartyCardProps = {
  booking: RentalDetail;
};

function InfoSection({
  accentColor,
  iconName,
  label,
  primary,
  secondary,
  trailing,
}: {
  accentColor: string;
  iconName: "bicycle" | "person.fill";
  label: string;
  primary: string;
  secondary?: string | null;
  trailing?: ReactNode;
}) {
  return (
    <XStack alignItems="center" gap="$4" padding="$5">
      <YStack
        alignItems="center"
        backgroundColor="$surfaceAccent"
        borderRadius="$round"
        height={58}
        justifyContent="center"
        width={58}
      >
        <IconSymbol color={accentColor} name={iconName} size={28} />
      </YStack>

      <YStack flex={1} gap="$1">
        <AppText tone="subtle" variant="meta">
          {label}
        </AppText>
        <AppText numberOfLines={1} variant="subhead">
          {primary}
        </AppText>
        {secondary
          ? (
              <AppText numberOfLines={1} tone="muted" variant="bodySmall">
                {secondary}
              </AppText>
            )
          : null}
      </YStack>

      {trailing ?? null}
    </XStack>
  );
}

export function StaffPartyCard({ booking }: StaffPartyCardProps) {
  const theme = useTheme();

  const handleCall = () => {
    void Linking.openURL(`tel:${booking.user.phoneNumber}`);
  };

  return (
    <AppCard
      borderColor="$borderSubtle"
      borderRadius="$5"
      borderWidth={borderWidths.subtle}
      chrome="flat"
      overflow="hidden"
      padding="$0"
      style={elevations.whisper}
    >
      <InfoSection
        accentColor={theme.textBrand.val}
        iconName="bicycle"
        label="Xe đạp"
        primary={formatSupportCode(booking.bike.id)}
        secondary={`Chip: ${getBikeChipDisplay(booking.bike)}`}
      />

      <YStack borderTopColor="$borderSubtle" borderTopWidth={borderWidths.subtle}>
        <InfoSection
          accentColor={theme.actionPrimary.val}
          iconName="person.fill"
          label="Khách hàng"
          primary={booking.user.fullname}
          secondary={booking.user.phoneNumber}
          trailing={(
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleCall}
              style={({ pressed }) => ({
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <YStack
                alignItems="center"
                backgroundColor="$surfaceDefault"
                borderColor="$borderSubtle"
                borderRadius="$round"
                borderWidth={borderWidths.subtle}
                height={56}
                justifyContent="center"
                shadowColor="$shadowColor"
                shadowOffset={{ width: 0, height: 3 }}
                shadowOpacity={0.08}
                shadowRadius={12}
                width={56}
              >
                <IconSymbol color={theme.textSecondary.val} name="phone" size={24} />
              </YStack>
            </Pressable>
          )}
        />
      </YStack>
    </AppCard>
  );
}
