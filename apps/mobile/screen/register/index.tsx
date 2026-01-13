import { BikeColors } from "@constants/BikeColors";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import RegisterForm from "./components/register-form";
import RegisterHeader from "./components/register-header";
import { useRegister } from "./hooks/use-register";

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <RegisterHeader onBack={goBack} />
        <View style={styles.body}>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default RegisterScreen;
