import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image } from "react-native";
import { Button, useTheme, View, YStack } from "tamagui";

import { borderWidths, spaceScale } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { AppText } from "@ui/primitives/app-text";
import { StatusBadge } from "@ui/primitives/status-badge";

const avatarFrameSize = spaceScale[10] + spaceScale[9] + spaceScale[6];
const avatarImageSize = avatarFrameSize - spaceScale[3];
const avatarActionButtonSize = spaceScale[8] - borderWidths.strong;

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

type UpdateProfileHeaderProps = {
  onBack: () => void;
  onStartEdit: () => void;
  isEditing: boolean;
  isBusy: boolean;
  avatarUrl: string;
  fullName: string;
  onPickAvatar: () => void;
  isPickingAvatar: boolean;
  hasPendingAvatar: boolean;
};

export function UpdateProfileHeader({
  onBack,
  onStartEdit,
  isEditing,
  isBusy,
  avatarUrl,
  fullName,
  onPickAvatar,
  isPickingAvatar,
  hasPendingAvatar,
}: UpdateProfileHeaderProps) {
  const theme = useTheme();
  const [hasAvatarLoadError, setHasAvatarLoadError] = useState(false);
  const shouldShowAvatarImage = Boolean(avatarUrl) && !hasAvatarLoadError;
  const avatarFallbackLabel = getAvatarFallbackLabel(fullName);

  useEffect(() => {
    setHasAvatarLoadError(false);
  }, [avatarUrl]);

  return (
    <AppHeroHeader
      accessory={isEditing
        ? (
            <StatusBadge
              label={hasPendingAvatar ? "ẢNH MỚI" : "ĐANG SỬA"}
              pulseDot
              size="compact"
              tone="overlaySuccess"
            />
          )
        : (
            <Button
              backgroundColor="$overlayGlass"
              borderRadius="$round"
              chromeless
              disabled={isBusy}
              minHeight={36}
              onPress={onStartEdit}
              paddingHorizontal="$3"
              pressStyle={{ opacity: 0.9, scale: 0.98 }}
            >
              <MaterialIcons color={theme.onSurfaceBrand.val} name="edit" size={16} />
            </Button>
          )}
      footer={(
        <YStack alignItems="center" marginBottom="$4">
          <View
            alignItems="center"
            height={avatarFrameSize}
            justifyContent="center"
            overflow="visible"
            position="relative"
            width={avatarFrameSize}
          >
            <View
              alignItems="center"
              backgroundColor="$overlayGlassMuted"
              borderColor="$overlayGlass"
              borderRadius="$round"
              borderWidth={borderWidths.subtle}
              height={avatarImageSize}
              justifyContent="center"
              overflow="hidden"
              width={avatarImageSize}
            >
              {shouldShowAvatarImage
                ? (
                    <Image
                      onError={() => setHasAvatarLoadError(true)}
                      source={{ uri: avatarUrl }}
                      style={{ width: avatarImageSize, height: avatarImageSize, borderRadius: avatarImageSize / 2 }}
                    />
                  )
                : avatarFallbackLabel
                  ? (
                      <AppText
                        color={theme.onSurfaceBrand.val}
                        fontSize={30}
                        fontWeight="800"
                        letterSpacing={0.5}
                      >
                        {avatarFallbackLabel}
                      </AppText>
                    )
                  : <MaterialIcons color={theme.onSurfaceBrand.val} name="account-circle" size={56} />}
            </View>

            <Button
              backgroundColor="$surfaceDefault"
              borderColor="$borderSubtle"
              borderRadius="$round"
              borderWidth={borderWidths.subtle}
              bottom={-spaceScale[0]}
              chromeless
              disabled={isBusy || isPickingAvatar || !isEditing}
              height={avatarActionButtonSize}
              onPress={onPickAvatar}
              position="absolute"
              pressStyle={{ opacity: 0.92, scale: 0.98 }}
              right={spaceScale[2]}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 6 }}
              shadowOpacity={0.16}
              shadowRadius={14}
              width={avatarActionButtonSize}
              padding={0}
            >
              {isPickingAvatar
                ? <ActivityIndicator color={theme.actionPrimary.val} size="small" />
                : <MaterialIcons color={theme.actionPrimary.val} name="photo-camera" size={20} />}
            </Button>
          </View>
        </YStack>
      )}
      onBack={onBack}
      size="compact"
      title="Hồ sơ"
    />
  );
}
