import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { colors } from "@theme/colors";
import { spacing } from "@theme/metrics";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

type AuthScreenVariant = "sheet" | "plain";

type AuthScreenProps = {
  children: ReactNode;
  header: ReactNode;
  variant?: AuthScreenVariant;
  bodyStyle?: StyleProp<ViewStyle>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  body: {
    flex: 1,
    backgroundColor: colors.backgroundStrong,
  },
  sheet: {
    backgroundColor: colors.backgroundStrong,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  plain: {
    backgroundColor: colors.background,
    paddingBottom: spacing.xxxl,
  },
});

export function AuthScreen({ children, header, variant = "sheet", bodyStyle }: AuthScreenProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {header}
        <View style={[styles.body, variant === "sheet" ? styles.sheet : styles.plain, bodyStyle]}>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
