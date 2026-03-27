import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { spacingRules } from "@theme/metrics";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useTheme } from "tamagui";

type AuthScreenVariant = "sheet" | "plain";

type AuthScreenProps = {
  children: ReactNode;
  header: ReactNode;
  variant?: AuthScreenVariant;
  bodyStyle?: StyleProp<ViewStyle>;
};

export function AuthScreen({ children, header, variant = "sheet", bodyStyle }: AuthScreenProps) {
  const theme = useTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{
        flex: 1,
        backgroundColor: theme.backgroundCanvas.val,
      }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {header}
        <View
          style={[
            {
              flex: 1,
              backgroundColor: variant === "sheet" ? theme.backgroundRaised.val : theme.backgroundCanvas.val,
              paddingTop: variant === "sheet" ? spacingRules.card.paddingDefault : 0,
              paddingBottom: spacingRules.hero.paddingBottomCompact,
            },
            bodyStyle,
          ]}
        >
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
