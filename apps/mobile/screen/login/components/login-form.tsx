import type { Control, FieldErrors } from "react-hook-form";

import { Controller } from "react-hook-form";
import { Pressable } from "react-native";
import { useTheme, YStack } from "tamagui";

import type { LoginSchemaFormData } from "@schemas/authSchema";

import { IconSymbol } from "@components/IconSymbol";
import { AppButton } from "@ui/primitives/app-button";
import { AppInput } from "@ui/primitives/app-input";
import { AppText } from "@ui/primitives/app-text";
import { Field } from "@ui/primitives/field";

type LoginFormProps = {
  control: Control<LoginSchemaFormData>;
  errors: FieldErrors<LoginSchemaFormData>;
  showPassword: boolean;
  toggleShowPassword: () => void;
  onSubmit: () => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  isSubmitting: boolean;
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
}: LoginFormProps) {
  const theme = useTheme();

  return (
    <YStack gap="$5">

      <Field error={errors.email?.message} label="Email">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <AppInput
              autoCapitalize="none"
              autoCorrect={false}
              invalid={Boolean(errors.email?.message)}
              keyboardType="email-address"
              leadingIcon={<IconSymbol name="envelope" size={18} color={theme.textSecondary.val} />}
              onChangeText={onChange}
              placeholder="Nhập email của bạn"
              value={value}
            />
          )}
        />
      </Field>

      <Field error={errors.password?.message} label="Mật khẩu">
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <AppInput
              autoCapitalize="none"
              autoCorrect={false}
              invalid={Boolean(errors.password?.message)}
              leadingIcon={<IconSymbol name="lock" size={18} color={theme.textSecondary.val} />}
              onChangeText={onChange}
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
              trailingIcon={(
                <Pressable onPress={toggleShowPassword}>
                  <IconSymbol
                    name={showPassword ? "eye.slash" : "eye"}
                    size={18}
                    color={theme.textSecondary.val}
                  />
                </Pressable>
              )}
              value={value}
            />
          )}
        />
      </Field>

      <Pressable onPress={onForgotPassword} style={{ alignSelf: "flex-end", marginTop: -4 }}>
        <AppText tone="brand" variant="label">Quên mật khẩu?</AppText>
      </Pressable>

      <AppButton loading={isSubmitting} onPress={onSubmit}>
        Đăng nhập
      </AppButton>

      <YStack alignItems="center" gap="$1">
        <AppText tone="muted" variant="bodySmall">Chưa có tài khoản?</AppText>
        <Pressable onPress={onRegister}>
          <AppText tone="brand" variant="label">Tạo tài khoản mới</AppText>
        </Pressable>
      </YStack>
    </YStack>
  );
}

export default LoginForm;
