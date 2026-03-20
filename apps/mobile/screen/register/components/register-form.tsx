import type { Control, FieldErrors } from "react-hook-form";

import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppButton } from "@ui/primitives/app-button";
import { AppInput } from "@ui/primitives/app-input";
import { AppText } from "@ui/primitives/app-text";
import { Field } from "@ui/primitives/field";
import { Controller } from "react-hook-form";
import { Pressable } from "react-native";
import { YStack } from "tamagui";

import type { RegisterFormValues } from "../hooks/use-register";

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
    <YStack gap="$6">

      <Field error={errors.fullname?.message} label="Họ và tên">
        <Controller
          control={control}
          name="fullname"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              autoCapitalize="words"
              invalid={Boolean(errors.fullname?.message)}
              leadingIcon={<IconSymbol name="person" size={18} color={colors.textSecondary} />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nhập họ và tên"
              value={value}
            />
          )}
        />
      </Field>

      <Field error={errors.email?.message} label="Email">
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              autoCapitalize="none"
              autoCorrect={false}
              invalid={Boolean(errors.email?.message)}
              keyboardType="email-address"
              leadingIcon={<IconSymbol name="envelope" size={18} color={colors.textSecondary} />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nhập email"
              value={value}
            />
          )}
        />
      </Field>

      <Field error={errors.phoneNumber?.message} label="Số điện thoại">
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              invalid={Boolean(errors.phoneNumber?.message)}
              keyboardType="phone-pad"
              leadingIcon={<IconSymbol name="phone" size={18} color={colors.textSecondary} />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nhập số điện thoại"
              value={value ?? ""}
            />
          )}
        />
      </Field>

      <Field error={errors.password?.message} label="Mật khẩu">
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              autoCapitalize="none"
              invalid={Boolean(errors.password?.message)}
              leadingIcon={<IconSymbol name="lock" size={18} color={colors.textSecondary} />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
              trailingIcon={(
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <IconSymbol
                    name={showPassword ? "eye.slash" : "eye"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
              )}
              value={value}
            />
          )}
        />
      </Field>

      <Field error={errors.confirmPassword?.message} label="Xác nhận mật khẩu">
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              autoCapitalize="none"
              invalid={Boolean(errors.confirmPassword?.message)}
              leadingIcon={<IconSymbol name="lock" size={18} color={colors.textSecondary} />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Xác nhận mật khẩu"
              secureTextEntry={!showConfirmPassword}
              trailingIcon={(
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <IconSymbol
                    name={showConfirmPassword ? "eye.slash" : "eye"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
              )}
              value={value}
            />
          )}
        />
      </Field>

      <AppButton loading={isSubmitting} onPress={onSubmit}>
        Đăng ký
      </AppButton>

      <YStack alignItems="center" gap="$1">
        <AppText tone="muted" variant="bodySmall">Đã có tài khoản?</AppText>
        <Pressable onPress={onGoToLogin}>
          <AppText tone="brand" variant="label">Quay lại đăng nhập</AppText>
        </Pressable>
      </YStack>
    </YStack>
  );
}

export default RegisterForm;
