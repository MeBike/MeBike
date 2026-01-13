import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

import LoginForm from "./components/login-form";
import LoginHeader from "./components/login-header";
import { useLogin } from "./hooks/use-login";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    flexGrow: 1,
  },
});

function LoginScreen() {
  const {
    control,
    errors,
    showPassword,
    toggleShowPassword,
    backendStatus,
    rotateAnim,
    submit,
    isSubmitting,
    goToRegister,
    goBack,
    handleForgotPassword,
  } = useLogin();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LoginHeader onBack={goBack} backendStatus={backendStatus} />
        <LoginForm
          control={control}
          errors={errors}
          showPassword={showPassword}
          toggleShowPassword={toggleShowPassword}
          onSubmit={submit}
          onForgotPassword={handleForgotPassword}
          onRegister={goToRegister}
          isSubmitting={isSubmitting}
          rotateAnim={rotateAnim}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;
