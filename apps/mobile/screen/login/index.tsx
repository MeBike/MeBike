import { spacing } from "@theme/metrics";
import { AuthScreen } from "@ui/patterns/auth-screen";
import { StyleSheet, View } from "react-native";

import LoginForm from "./components/login-form";
import LoginHeader from "./components/login-header";
import { useLogin } from "./hooks/use-login";

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});

function LoginScreen() {
  const {
    control,
    errors,
    showPassword,
    toggleShowPassword,
    backendStatus,
    submit,
    isSubmitting,
    goToRegister,
    goBack,
    handleForgotPassword,
  } = useLogin();

  return (
    <AuthScreen header={<LoginHeader backendStatus={backendStatus} onBack={goBack} />}>
      <View style={styles.content}>
        <LoginForm
          control={control}
          errors={errors}
          showPassword={showPassword}
          toggleShowPassword={toggleShowPassword}
          onSubmit={submit}
          onForgotPassword={handleForgotPassword}
          onRegister={goToRegister}
          isSubmitting={isSubmitting}
        />
      </View>
    </AuthScreen>
  );
}

export default LoginScreen;
