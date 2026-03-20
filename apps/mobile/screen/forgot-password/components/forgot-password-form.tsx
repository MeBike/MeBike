import type { ForgotPasswordSchemaFormData } from "@schemas/authSchema";
import type { Control, FieldErrors } from "react-hook-form";

import { Ionicons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { AppButton } from "@ui/primitives/app-button";
import { AppInput } from "@ui/primitives/app-input";
import { Field } from "@ui/primitives/field";
import { Controller } from "react-hook-form";
import { YStack } from "tamagui";

type ForgotPasswordFormProps = {
  control: Control<ForgotPasswordSchemaFormData>;
  errors: FieldErrors<ForgotPasswordSchemaFormData>;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function ForgotPasswordForm({
  control,
  errors,
  onSubmit,
  isSubmitting,
}: ForgotPasswordFormProps) {
  return (
    <YStack gap="$4">
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
              leadingIcon={<Ionicons name="mail" size={18} color={colors.textSecondary} />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nhập email"
              value={value}
            />
          )}
        />
      </Field>

      <AppButton loading={isSubmitting} onPress={onSubmit}>
        Xác nhận
      </AppButton>
    </YStack>
  );
}
