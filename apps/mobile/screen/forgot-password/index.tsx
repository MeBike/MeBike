import { BikeColors } from "@constants/BikeColors";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import { ForgotPasswordForm } from "./components/forgot-password-form";
import { ForgotPasswordHeader } from "./components/forgot-password-header";
import { useForgotPassword } from "./hooks/use-forgot-password";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  body: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
});

function ForgotPasswordScreen() {
  const { control, errors, submit, isSubmitting, goBack } = useForgotPassword();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ForgotPasswordHeader onBack={goBack} />
        <View style={styles.body}>
          <ForgotPasswordForm
            control={control}
            errors={errors}
            onSubmit={submit}
            isSubmitting={isSubmitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default ForgotPasswordScreen;
