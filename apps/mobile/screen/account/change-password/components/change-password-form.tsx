import type { Control, FieldErrors } from "react-hook-form";

import { IconSymbol } from "@components/IconSymbol";
import { AppInput } from "@ui/primitives/app-input";
import { Field } from "@ui/primitives/field";
import { Controller } from "react-hook-form";
import { Pressable } from "react-native";
import { useTheme, YStack } from "tamagui";

import type { ChangePasswordFormValues } from "../change-password.schema";

type PasswordField = "oldPassword" | "newPassword" | "confirmPassword";

type ChangePasswordFormProps = {
  control: Control<ChangePasswordFormValues>;
  errors: FieldErrors<ChangePasswordFormValues>;
  onSubmit: () => void;
  visibleFields: Record<PasswordField, boolean>;
  onToggleFieldVisibility: (field: PasswordField) => void;
};

export function ChangePasswordForm({
  control,
  errors,
  onSubmit,
  visibleFields,
  onToggleFieldVisibility,
}: ChangePasswordFormProps) {
  const theme = useTheme();

  const buildVisibilityToggle = (field: PasswordField) => (
    <Pressable
      accessibilityLabel={visibleFields[field] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      hitSlop={8}
      onPress={() => onToggleFieldVisibility(field)}
      style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
    >
      <IconSymbol
        color={theme.textSecondary.val}
        name={visibleFields[field] ? "eye-off" : "eye"}
        size="input"
      />
    </Pressable>
  );

  return (
    <YStack gap="$6">
      <YStack gap="$4">
        <Field error={errors.oldPassword?.message} label="Mật khẩu hiện tại">
          <Controller
            control={control}
            name="oldPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <AppInput
                autoCapitalize="none"
                autoCorrect={false}
                invalid={Boolean(errors.oldPassword?.message)}
                leadingIcon={<IconSymbol color={theme.textSecondary.val} name="lock" size="input" />}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry={!visibleFields.oldPassword}
                textContentType="password"
                trailingIcon={buildVisibilityToggle("oldPassword")}
                value={value}
              />
            )}
          />
        </Field>

        <Field error={errors.newPassword?.message} label="Mật khẩu mới">
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <AppInput
                autoCapitalize="none"
                autoCorrect={false}
                invalid={Boolean(errors.newPassword?.message)}
                leadingIcon={<IconSymbol color={theme.textSecondary.val} name="lock" size="input" />}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Nhập mật khẩu mới"
                secureTextEntry={!visibleFields.newPassword}
                textContentType="newPassword"
                trailingIcon={buildVisibilityToggle("newPassword")}
                value={value}
              />
            )}
          />
        </Field>

        <Field
          description="Mật khẩu mới nên khác mật khẩu cũ và đủ dễ để bạn ghi nhớ."
          error={errors.confirmPassword?.message}
          label="Xác nhận mật khẩu mới"
        >
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onBlur, onChange, value } }) => (
              <AppInput
                autoCapitalize="none"
                autoCorrect={false}
                invalid={Boolean(errors.confirmPassword?.message)}
                leadingIcon={<IconSymbol color={theme.textSecondary.val} name="lock" size="input" />}
                onBlur={onBlur}
                onChangeText={onChange}
                onSubmitEditing={onSubmit}
                placeholder="Nhập lại mật khẩu mới"
                returnKeyType="done"
                secureTextEntry={!visibleFields.confirmPassword}
                textContentType="newPassword"
                trailingIcon={buildVisibilityToggle("confirmPassword")}
                value={value}
              />
            )}
          />
        </Field>
      </YStack>
    </YStack>
  );
}
