import type { Control, FieldErrors } from "react-hook-form";

import { AuthSegmentedToggle } from "@components/auth-segmented-toggle";
import { Controller } from "react-hook-form";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { RegisterFormValues } from "../hooks/use-register";

import { IconSymbol } from "../../../components/IconSymbol";
import { BikeColors } from "../../../constants/BikeColors";

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    padding: 20,
  },
  segmentedToggle: {
    marginBottom: 18,
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
    paddingVertical: 8,
    minHeight: 48,
    backgroundColor: BikeColors.background,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 0,
    includeFontPadding: false,
    color: BikeColors.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  registerButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 4,
  },
});

type RegisterFormProps = {
  control: Control<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
  showPassword: boolean;
  showConfirmPassword: boolean;
  setShowPassword: (show: boolean) => void;
  setShowConfirmPassword: (show: boolean) => void;
  onSubmit: () => void;
  onGoToLogin: () => void;
  isSubmitting: boolean;
};

function RegisterForm({
  control,
  errors,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
  onSubmit,
  onGoToLogin,
  isSubmitting,
}: RegisterFormProps) {
  return (
    <View style={styles.formContainer}>
      <View style={styles.segmentedToggle}>
        <AuthSegmentedToggle
          value="register"
          onChange={(next) => {
            if (next === "login")
              onGoToLogin();
          }}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Họ và tên</Text>
        <View style={styles.inputWithIcon}>
          <IconSymbol
            name="person"
            size={20}
            color={BikeColors.textSecondary}
          />
          <Controller
            control={control}
            name="fullname"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên"
                placeholderTextColor={BikeColors.textSecondary}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
              />
            )}
          />
        </View>
        {errors.fullname?.message && <Text style={styles.errorText}>{errors.fullname.message}</Text>}
      </View>

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
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={styles.input}
                placeholder="Nhập email"
                placeholderTextColor={BikeColors.textSecondary}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
        </View>
        {errors.email?.message && <Text style={styles.errorText}>{errors.email.message}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Số điện thoại</Text>
        <View style={styles.inputWithIcon}>
          <IconSymbol
            name="phone"
            size={20}
            color={BikeColors.textSecondary}
          />
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={BikeColors.textSecondary}
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
              />
            )}
          />
        </View>
        {errors.phoneNumber?.message && <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>}
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
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={BikeColors.textSecondary}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
            )}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <IconSymbol
              name={showPassword ? "eye.slash" : "eye"}
              size={20}
              color={BikeColors.textSecondary}
            />
          </Pressable>
        </View>
        {errors.password?.message && <Text style={styles.errorText}>{errors.password.message}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
        <View style={styles.inputWithIcon}>
          <IconSymbol
            name="lock"
            size={20}
            color={BikeColors.textSecondary}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor={BikeColors.textSecondary}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
            )}
          />
          <Pressable
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            <IconSymbol
              name={showConfirmPassword ? "eye.slash" : "eye"}
              size={20}
              color={BikeColors.textSecondary}
            />
          </Pressable>
        </View>
        {errors.confirmPassword?.message && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
      </View>

      <Pressable
        style={[styles.registerButton, isSubmitting && styles.disabledButton]}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.registerButtonText}>
          {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
        </Text>
      </Pressable>
    </View>
  );
}

export default RegisterForm;
