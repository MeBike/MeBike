import { View } from "react-native";

import { spaceScale } from "@theme/metrics";
import { AuthScreen } from "@ui/patterns/auth-screen";

import LoginForm from "./components/login-form";
import LoginHeader from "./components/login-header";
import { useLogin } from "./hooks/use-login";

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
      <View style={{ paddingHorizontal: spaceScale[6], paddingTop: spaceScale[4], paddingBottom: spaceScale[7] }}>
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
