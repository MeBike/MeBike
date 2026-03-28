import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack } from "tamagui";

import { borderWidths, spaceScale } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { AppButton } from "@ui/primitives/app-button";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";

import { UpdateProfileForm } from "./components/update-profile-form";
import { UpdateProfileHeader } from "./components/update-profile-header";
import { useUpdateProfile } from "./hooks/use-update-profile";

export default function UpdateProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const {
    user,
    isLoading,
    isEditing,
    startEdit,
    cancelEdit,
    submit,
    goBack,
    control,
    errors,
    avatar,
    pickAvatar,
    isPickingAvatar,
    hasPendingAvatar,
    isSaving,
    addressSuggestions,
    selectSuggestion,
    setLocation,
  } = useUpdateProfile();

  if (isLoading && !user) {
    return (
      <Screen inset="default" paddedY tone="canvas">
        <YStack alignItems="center" flex={1} gap="$3" justifyContent="center">
          <ActivityIndicator color={theme.actionPrimary.val} size="large" />
          <AppText tone="muted" variant="bodySmall">Đang tải thông tin hồ sơ...</AppText>
        </YStack>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="$actionPrimary" tone="canvas">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack backgroundColor="$actionPrimary" flex={1}>
          <UpdateProfileHeader
            avatarUrl={avatar}
            hasPendingAvatar={hasPendingAvatar}
            isBusy={isSaving}
            isEditing={isEditing}
            isPickingAvatar={isPickingAvatar}
            onBack={goBack}
            onPickAvatar={pickAvatar}
            onStartEdit={startEdit}
          />

          <YStack flex={1} marginTop={-spaceScale[5]}  position="relative">
            <AppCard
              borderBottomLeftRadius="$0"
              borderBottomRightRadius="$0"
              borderTopLeftRadius="$5"
              borderTopRightRadius="$5"
              elevated={false}
              flex={1}
              overflow="hidden"
              padding="$0"
            >
            <ScrollView
              contentContainerStyle={{
                paddingTop: spaceScale[7],
                paddingHorizontal: spaceScale[6],
                paddingBottom: isEditing ? Math.max(insets.bottom + 140, 172) : Math.max(insets.bottom + 32, 48),
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <UpdateProfileForm
                control={control}
                email={user?.email ?? ""}
                errors={errors}
                isEditing={isEditing}
                locationSuggestions={addressSuggestions}
                onLocationChange={setLocation}
                onSelectLocationSuggestion={selectSuggestion}
              />
            </ScrollView>
            </AppCard>

            {isEditing
              ? (
                  <YStack
                    backgroundColor="$surfaceDefault"
                    borderTopColor="$borderSubtle"
                    borderTopWidth={borderWidths.subtle}
                    bottom={0}
                    gap="$3"
                    left={0}
                    paddingBottom={Math.max(insets.bottom, spaceScale[5])}
                    paddingHorizontal="$5"
                    paddingTop="$4"
                    position="absolute"
                    right={0}
                  >
                    <AppButton buttonSize="large" loading={isSaving} onPress={submit}>
                      Lưu thay đổi
                    </AppButton>
                    <AppButton buttonSize="large" disabled={isSaving} onPress={cancelEdit} tone="outline">
                      Hủy
                    </AppButton>
                  </YStack>
                )
              : null}
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}
