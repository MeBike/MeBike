import { borderWidths, spaceScale } from "@theme/metrics";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { Screen } from "@ui/primitives/screen";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { ChangePasswordForm } from "./components/change-password-form";
import { useChangePassword } from "./hooks/use-change-password";

const actionBarPaddingTop = spaceScale[4];
const actionBarGap = spaceScale[3];
const actionButtonHeight = spaceScale[7];
const actionBarMinBottomPadding = spaceScale[5];
const actionBarReservedHeight = actionBarPaddingTop + actionBarGap + actionButtonHeight * 2;

function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const {
    control,
    errors,
    goBack,
    isSubmitting,
    submit,
    toggleFieldVisibility,
    visibleFields,
  } = useChangePassword();

  const contentBottomPadding = actionBarReservedHeight + Math.max(insets.bottom, actionBarMinBottomPadding);

  return (
    <Screen backgroundColor="$actionPrimary" tone="canvas">
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack backgroundColor="$actionPrimary" flex={1}>
          <AppHeroHeader
            onBack={goBack}
            size="compact"
            subtitle="Cập nhật mật khẩu để giữ tài khoản của bạn an toàn."
            title="Bảo mật & Mật khẩu"
          />

          <YStack flex={1} marginTop="$-5" position="relative">
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
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <YStack
                  gap="$6"
                  paddingBottom={contentBottomPadding}
                  paddingHorizontal="$6"
                  paddingTop="$6"
                >
                  <ChangePasswordForm
                    control={control}
                    errors={errors}
                    onSubmit={submit}
                    onToggleFieldVisibility={toggleFieldVisibility}
                    visibleFields={visibleFields}
                  />
                </YStack>
              </ScrollView>
            </AppCard>

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
              <AppButton buttonSize="large" loading={isSubmitting} onPress={submit}>
                Xác nhận thay đổi
              </AppButton>
              <AppButton buttonSize="large" disabled={isSubmitting} onPress={goBack} tone="outline">
                Quay lại
              </AppButton>
            </YStack>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export default ChangePasswordScreen;
