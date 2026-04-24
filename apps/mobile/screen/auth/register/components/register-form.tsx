import type { Control, FieldErrors } from "react-hook-form";

import { IconSymbol } from "@components/IconSymbol";
import { AppButton } from "@ui/primitives/app-button";
import { AppInput } from "@ui/primitives/app-input";
import { AppText } from "@ui/primitives/app-text";
import { Field } from "@ui/primitives/field";
import { Controller } from "react-hook-form";
import { Pressable } from "react-native";
import { useTheme, YStack } from "tamagui";

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
  const theme = useTheme();

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
              leadingIcon={<IconSymbol color={theme.textSecondary.val} name="person" size="input" />}
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
              leadingIcon={<IconSymbol color={theme.textSecondary.val} name="mail" size="input" />}
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
              leadingIcon={<IconSymbol color={theme.textSecondary.val} name="phone" size="input" />}
              maxLength={10}
              onBlur={onBlur}
              onChangeText={text => onChange(text.replace(/\D/g, ""))}
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
              leadingIcon={<IconSymbol color={theme.textSecondary.val} name="lock" size="input" />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
              trailingIcon={(
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <IconSymbol
                    name={showPassword ? "eye-off" : "eye"}
                    size="input"
                    color={theme.textSecondary.val}
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
              leadingIcon={<IconSymbol color={theme.textSecondary.val} name="lock" size="input" />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Xác nhận mật khẩu"
              secureTextEntry={!showConfirmPassword}
              trailingIcon={(
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <IconSymbol
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size="input"
                    color={theme.textSecondary.val}
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
