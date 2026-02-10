import { BikeColors } from "@constants/BikeColors";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import LoginForm from "./components/login-form";
import LoginHeader from "./components/login-header";
import { useLogin } from "./hooks/use-login";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.surface,
  },
  scrollContent: {
    flexGrow: 1,
  },
  body: {
    flex: 1,
    backgroundColor: BikeColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 8,
    paddingBottom: 24,
    overflow: "hidden",
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
        <View style={styles.body}>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;
