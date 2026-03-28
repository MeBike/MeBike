import { MaterialIcons } from "@expo/vector-icons";
import { ActivityIndicator, Image } from "react-native";
import { Button, View, YStack, useTheme } from "tamagui";

import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { spaceScale } from "@theme/metrics";
import { StatusBadge } from "@ui/primitives/status-badge";

type UpdateProfileHeaderProps = {
  onBack: () => void;
  onStartEdit: () => void;
  isEditing: boolean;
  isBusy: boolean;
  avatarUrl: string;
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
  onPickAvatar,
  isPickingAvatar,
  hasPendingAvatar,
}: UpdateProfileHeaderProps) {
  const theme = useTheme();

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
        <YStack alignItems="center"  marginBottom={"$4"} >
          <View
            alignItems="center"
            height={136}
            justifyContent="center"
            overflow="visible"
            position="relative"
            width={136}
          >
            <View
              alignItems="center"
              backgroundColor="$overlayGlassMuted"
              borderColor="$overlayGlass"
              borderRadius="$round"
              borderWidth={"$1"}
              justifyContent="center"
              overflow="hidden"
            >
              {avatarUrl
                ? <Image source={{ uri: avatarUrl }} style={{ width: 124, height: 124 }} />
                : <MaterialIcons color={theme.onSurfaceBrand.val} name="account-circle" size={56} />}
            </View>

            <Button
              backgroundColor="$surfaceDefault"
              borderColor="$borderSubtle"
              borderRadius="$round"
              borderWidth={1}
              bottom={-spaceScale[0]}
              chromeless
              disabled={isBusy || isPickingAvatar || !isEditing}
              height={38}
              onPress={onPickAvatar}
              position="absolute"
              pressStyle={{ opacity: 0.92, scale: 0.98 }}
              right={spaceScale[2]}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 6 }}
              shadowOpacity={0.16}
              shadowRadius={14}
              width={38}
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
