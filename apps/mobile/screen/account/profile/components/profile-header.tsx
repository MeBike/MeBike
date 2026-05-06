import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { UserDetail } from "@services/users/user-service";

import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, radii, spaceScale, spacingRules } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

type ProfileHeaderProps = {
  profile: UserDetail;
  completedTrips?: number;
  isLoadingTrips?: boolean;
  onVerifyEmail?: () => void;
  topInset: number;
  formatDate: (dateString: string) => string;
};

const avatarSize = 92;
const verificationBadgeSize = 28;

function getAvatarFallbackLabel(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function ProfileHeader({
  profile,
  completedTrips,
  isLoadingTrips,
  onVerifyEmail: _onVerifyEmail,
  topInset,
  formatDate,
}: ProfileHeaderProps) {
  const theme = useTheme();
  const [hasAvatarLoadError, setHasAvatarLoadError] = useState(false);
  const memberSince = formatDate(profile.createdAt || profile.updatedAt);
  const isVerified = profile.verify === "VERIFIED";
  const showCompletedTrips = typeof completedTrips === "number";
  const shouldShowAvatarImage = Boolean(profile.avatar) && !hasAvatarLoadError;
  const avatarFallbackLabel = getAvatarFallbackLabel(profile.fullName);

  useEffect(() => {
    setHasAvatarLoadError(false);
  }, [profile.avatar]);

  return (
    <LinearGradient
      colors={[theme.actionPrimary.val, theme.actionSecondary.val]}
      end={{ x: 0.9, y: 1 }}
      start={{ x: 0.1, y: 0 }}
      style={{
        borderBottomLeftRadius: radii.xxl + spaceScale[1],
        borderBottomRightRadius: radii.xxl + spaceScale[1],
        paddingTop: topInset + spacingRules.hero.paddingTop,
        paddingHorizontal: spacingRules.hero.paddingX,
        paddingBottom: spaceScale[8],
      }}
    >
      <YStack gap="$5">
        <XStack alignItems="center" gap="$5">
          <XStack height={avatarSize} position="relative" width={avatarSize}>
            {shouldShowAvatarImage
              ? (
                  <Image
                    onError={() => setHasAvatarLoadError(true)}
                    source={{ uri: profile.avatar! }}
                    style={{
                      width: avatarSize,
                      height: avatarSize,
                      borderRadius: avatarSize / 2,
                      borderWidth: 4,
                      borderColor: theme.surfaceDefault.val,
                      backgroundColor: theme.surfaceMuted.val,
                    }}
                  />
                )
              : (
                  <XStack
                    alignItems="center"
                    backgroundColor={theme.surfaceDefault.val}
                    borderColor={theme.surfaceDefault.val}
                    borderRadius="$round"
                    borderWidth={4}
                    height={avatarSize}
                    justifyContent="center"
                    width={avatarSize}
                  >
                    {avatarFallbackLabel
                      ? (
                          <AppText
                            color={theme.actionPrimary.val}
                            fontSize={32}
                            fontWeight="800"
                            letterSpacing={0.5}
                          >
                            {avatarFallbackLabel}
                          </AppText>
                        )
                      : <MaterialIcons color={theme.textSecondary.val} name="account-circle" size={64} />}
                  </XStack>
                )}

            {isVerified
              ? (
                  <XStack
                    alignItems="center"
                    backgroundColor={theme.statusSuccess.val}
                    borderColor={theme.actionPrimary.val}
                    borderRadius="$round"
                    borderWidth={3}
                    bottom={0}
                    height={verificationBadgeSize}
                    justifyContent="center"
                    position="absolute"
                    right={-2}
                    width={verificationBadgeSize}
                  >
                    <IconSymbol color={theme.onStatusSuccess.val} name="check" size="caption" />
                  </XStack>
                )
              : null}
          </XStack>

          <YStack flex={1} gap="$2" minWidth={0}>
            <AppText numberOfLines={1} tone="inverted" variant="title">
              {profile.fullName || "Người dùng MeBike"}
            </AppText>

            <AppText
              numberOfLines={1}
              opacity={0.72}
              style={{ fontStyle: "italic" }}
              tone="inverted"
              variant="body"
            >
              Thành viên từ
              {" "}
              {memberSince}
            </AppText>

            <XStack alignItems="center" flexWrap="wrap" gap="$3">
              {showCompletedTrips
                ? (
                    <XStack
                      alignItems="center"
                      backgroundColor="$overlayGlass"
                      borderColor="$overlayGlass"
                      borderRadius="$4"
                      borderWidth={borderWidths.subtle}
                      gap="$2"
                      paddingHorizontal="$4"
                      paddingVertical="$2"
                    >
                      <AppText tone="inverted" variant="headline">
                        {isLoadingTrips ? "-" : String(completedTrips)}
                      </AppText>
                      <AppText opacity={0.82} tone="inverted" variant="eyebrow">
                        Chuyến đi
                      </AppText>
                    </XStack>
                  )
                : null}
            </XStack>
          </YStack>
        </XStack>
      </YStack>
    </LinearGradient>
  );
}

export default ProfileHeader;
