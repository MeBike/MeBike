import { IconSymbol } from "@components/IconSymbol";
import { radii, spaceScale } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, XStack, YStack } from "tamagui";

type ChangePasswordHeaderProps = {
  onBack: () => void;
};

export function ChangePasswordHeader({ onBack }: ChangePasswordHeaderProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const headerTopPadding = insets.top + spaceScale[4];
  const headerBottomPadding = spaceScale[9] + spaceScale[2];

  return (
    <YStack
      backgroundColor="$actionPrimary"
      borderBottomLeftRadius={radii.xxl}
      borderBottomRightRadius={radii.xxl}
      paddingBottom={headerBottomPadding}
      paddingHorizontal={spaceScale[5]}
      paddingTop={headerTopPadding}
    >
      <XStack alignItems="flex-start" gap="$4">
        <Pressable
          onPress={onBack}
          style={{
            width: 42,
            height: 42,
            borderRadius: radii.round,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.overlayGlass.val,
            marginTop: 2,
          }}
        >
          <IconSymbol color={theme.onSurfaceBrand.val} name="arrow-left" size="md" />
        </Pressable>

        <YStack flex={1} gap="$2" paddingTop="$1">
          <AppText color="$onSurfaceBrand" fontSize="$11" fontWeight="600" letterSpacing={-0.4} lineHeight={32}>
            Bảo mật & Mật khẩu
          </AppText>
          <AppText color="$onSurfaceBrand" fontWeight="400" maxWidth={320} opacity={0.9} variant="body">
            Cập nhật mật khẩu để giữ tài khoản của bạn an toàn.
          </AppText>
        </YStack>
      </XStack>
    </YStack>
  );
}
