import { spacing } from "@theme/metrics";
import { AuthScreen } from "@ui/patterns/auth-screen";
import { StyleSheet, View } from "react-native";

import { ForgotPasswordForm } from "./components/forgot-password-form";
import { ForgotPasswordHeader } from "./components/forgot-password-header";
import { useForgotPassword } from "./hooks/use-forgot-password";

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
});

function ForgotPasswordScreen() {
  const { control, errors, submit, isSubmitting, goBack } = useForgotPassword();

  return (
    <AuthScreen header={<ForgotPasswordHeader onBack={goBack} />}>
      <View style={styles.content}>
        <ForgotPasswordForm
          control={control}
          errors={errors}
          onSubmit={submit}
          isSubmitting={isSubmitting}
        />
      </View>
    </AuthScreen>
  );
}

export default ForgotPasswordScreen;
