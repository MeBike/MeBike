import { borderWidths, spaceScale } from "@theme/metrics";
import { AppButton } from "@ui/primitives/app-button";
import { Screen } from "@ui/primitives/screen";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { ChangePasswordForm } from "./components/change-password-form";
import { ChangePasswordHeader } from "./components/change-password-header";
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
    <Screen backgroundColor="$surfaceDefault" tone="canvas">
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack backgroundColor="$surfaceDefault" flex={1}>
          <ChangePasswordHeader onBack={goBack} />

          <YStack flex={1} marginTop={-spaceScale[6]} position="relative">
            <YStack
              backgroundColor="$surfaceDefault"
              borderTopLeftRadius="$6"
              borderTopRightRadius="$6"
              flex={1}
              overflow="hidden"
            >
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <YStack paddingBottom={contentBottomPadding} paddingHorizontal="$6" paddingTop="$6">
                  <ChangePasswordForm
                    control={control}
                    errors={errors}
                    onSubmit={submit}
                    onToggleFieldVisibility={toggleFieldVisibility}
                    visibleFields={visibleFields}
                  />
                </YStack>
              </ScrollView>
            </YStack>

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
