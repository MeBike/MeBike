import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { UserDetail } from "@services/users/user-service";

import avatarFallback from "@/assets/avatar2.png";
import { IconSymbol } from "@components/IconSymbol";
import { borderWidths, radii, spaceScale, spacingRules } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

type ProfileHeaderProps = {
  profile: UserDetail;
  completedTrips: number;
  isLoadingTrips: boolean;
  topInset: number;
  onVerifyEmail: () => void;
  formatDate: (dateString: string) => string;
};

const avatarSize = 92;
const verificationBadgeSize = 28;

function ProfileHeader({
  profile,
  completedTrips,
  isLoadingTrips,
  topInset,
  onVerifyEmail,
  formatDate,
}: ProfileHeaderProps) {
  const theme = useTheme();
  const memberSince = formatDate(profile.createdAt || profile.updatedAt);
  const isVerified = profile.verify === "VERIFIED";

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
            <Image
              source={profile.avatar ? { uri: profile.avatar } : avatarFallback}
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                borderWidth: 4,
                borderColor: theme.surfaceDefault.val,
                backgroundColor: theme.surfaceMuted.val,
              }}
            />

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
                    <IconSymbol color={theme.onStatusSuccess.val} name="checkmark" size={14} />
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

              {!isVerified
                ? (
                    <Pressable onPress={onVerifyEmail} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
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
                        <IconSymbol color={theme.onSurfaceBrand.val} name="envelope" size={16} />
                        <AppText tone="inverted" variant="badgeLabel">
                          Xác thực email
                        </AppText>
                      </XStack>
                    </Pressable>
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
