import type { LoginSchemaFormData } from "@schemas/authSchema";
import type { Control, FieldErrors } from "react-hook-form";

import { IconSymbol } from "@components/IconSymbol";
import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import { Controller } from "react-hook-form";
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: BikeColors.textPrimary,
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BikeColors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  inputIconStyle: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: BikeColors.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },
  eyeButtonContainer: {
    marginLeft: 8,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: BikeColors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    color: BikeColors.textSecondary,
    fontSize: 16,
  },
  registerLink: {
    color: BikeColors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 6,
  },
});

type LoginFormProps = {
  control: Control<LoginSchemaFormData>;
  errors: FieldErrors<LoginSchemaFormData>;
  showPassword: boolean;
  toggleShowPassword: () => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  isSubmitting: boolean;
  rotateAnim: Animated.Value;
};

function LoginForm({
  control,
  errors,
  showPassword,
  toggleShowPassword,
  onSubmit,
  onForgotPassword,
  onRegister,
  isSubmitting,
  rotateAnim,
}: LoginFormProps) {
  return (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={styles.inputWithIcon}>
          <IconSymbol
            name="envelope"
            size={20}
            color={BikeColors.textSecondary}
          />
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.inputIconStyle}
                placeholder="Nhập email của bạn"
                placeholderTextColor={BikeColors.textSecondary}
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
        </View>
        {errors.email?.message
          ? <Text style={styles.errorText}>{errors.email.message}</Text>
          : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Mật khẩu</Text>
        <View style={styles.inputWithIcon}>
          <IconSymbol
            name="lock"
            size={20}
            color={BikeColors.textSecondary}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.inputIconStyle}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={BikeColors.textSecondary}
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
          <View style={styles.eyeButtonContainer}>
            <Pressable
              onPress={toggleShowPassword}
              style={styles.eyeButton}
            >
              <IconSymbol
                name={showPassword ? "eye.slash" : "eye"}
                size={20}
                color={BikeColors.textSecondary}
              />
            </Pressable>
          </View>
        </View>
        {errors.password?.message
          ? <Text style={styles.errorText}>{errors.password.message}</Text>
          : null}
      </View>

      <Pressable style={styles.forgotPassword} onPress={onForgotPassword}>
        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
      </Pressable>

      <Pressable
        style={[styles.loginButton, isSubmitting && styles.disabledButton]}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting
          ? (
              <Animated.View
                style={{
                  transform: [{
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  }],
                }}
              >
                <Ionicons name="reload" size={20} color="white" />
              </Animated.View>
            )
          : (
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            )}
      </Pressable>
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Chưa có tài khoản? </Text>
        <Pressable onPress={onRegister}>
          <Text style={styles.registerLink}>Đăng ký ngay</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default LoginForm;
