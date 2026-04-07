import { View } from "react-native";

import { spaceScale } from "@theme/metrics";
import { AuthScreen } from "@ui/patterns/auth-screen";

import { ForgotPasswordForm } from "./components/forgot-password-form";
import { ForgotPasswordHeader } from "./components/forgot-password-header";
import { useForgotPassword } from "./hooks/use-forgot-password";

function ForgotPasswordScreen() {
  const { control, errors, submit, isSubmitting, goBack } = useForgotPassword();

  return (
    <AuthScreen header={<ForgotPasswordHeader onBack={goBack} />}>
      <View style={{ paddingHorizontal: spaceScale[6], paddingBottom: spaceScale[7] }}>
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
