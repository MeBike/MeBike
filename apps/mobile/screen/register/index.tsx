import { spacing } from "@theme/metrics";
import { AuthScreen } from "@ui/patterns/auth-screen";
import { StyleSheet, View } from "react-native";

import RegisterForm from "./components/register-form";
import RegisterHeader from "./components/register-header";
import { useRegister } from "./hooks/use-register";

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
});

function RegisterScreen() {
  const {
    control,
    errors,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    submit,
    isSubmitting,
    goBack,
  } = useRegister();

  return (
    <AuthScreen header={<RegisterHeader onBack={goBack} />}>
      <View style={styles.content}>
        <RegisterForm
          control={control}
          errors={errors}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          onSubmit={submit}
          onGoToLogin={goBack}
          isSubmitting={isSubmitting}
        />
      </View>
    </AuthScreen>
  );
}

export default RegisterScreen;
