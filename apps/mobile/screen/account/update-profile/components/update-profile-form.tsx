import type { Control, FieldErrors } from "react-hook-form";

import { MaterialIcons } from "@expo/vector-icons";
import { Controller } from "react-hook-form";
import { useTheme, XStack, YStack } from "tamagui";

import { IconSymbol } from "@components/IconSymbol";
import { AppInput } from "@ui/primitives/app-input";
import { AppText } from "@ui/primitives/app-text";
import { Field } from "@ui/primitives/field";

import type { TomTomAddressSuggestion } from "../lib/tomtom";
import type { UpdateProfileFormValues } from "../schema";

import { LocationSuggestions } from "./location-suggestions";

type UpdateProfileFormProps = {
  control: Control<UpdateProfileFormValues>;
  errors: FieldErrors<UpdateProfileFormValues>;
  email: string;
  isEditing: boolean;
  onLocationChange: (value: string) => void;
  locationSuggestions: TomTomAddressSuggestion[];
  onSelectLocationSuggestion: (item: TomTomAddressSuggestion) => void;
};

export function UpdateProfileForm({
  control,
  errors,
  email,
  isEditing,
  onLocationChange,
  locationSuggestions,
  onSelectLocationSuggestion,
}: UpdateProfileFormProps) {
  const theme = useTheme();

  return (
    <YStack gap="$5">
      <YStack gap="$2">
        <AppText variant="title">Thông tin cá nhân</AppText>
        <AppText tone="muted" variant="bodySmall">
          Cập nhật thông tin tài khoản của bạn.
        </AppText>
      </YStack>

      <Field error={errors.fullname?.message} label="Họ và tên">
        <Controller
          control={control}
          name="fullname"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              autoCapitalize="words"
              invalid={Boolean(errors.fullname?.message)}
              leadingIcon={<IconSymbol color={theme.textSecondary.val} name="person" size={18} />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nhập họ và tên"
              readOnly={!isEditing}
              value={value}
            />
          )}
        />
      </Field>

      <Field error={errors.username?.message} label="Username">
        <Controller
          control={control}
          name="username"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              autoCapitalize="none"
              autoCorrect={false}
              invalid={Boolean(errors.username?.message)}
              leadingIcon={<MaterialIcons color={theme.textSecondary.val} name="alternate-email" size={20} />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nhập username"
              readOnly={!isEditing}
              value={value ?? ""}
            />
          )}
        />
      </Field>

      <Field label="Email">
        <AppInput
          autoCapitalize="none"
          keyboardType="email-address"
          leadingIcon={<IconSymbol color={theme.textSecondary.val} name="envelope" size={18} />}
          placeholder="Email"
          readOnly
          trailingIcon={<MaterialIcons color={theme.textSecondary.val} name="lock-outline" size={20} />}
          value={email}
        />
        <XStack alignItems="center" gap="$2" paddingLeft="$1">
          <MaterialIcons color={theme.textSecondary.val} name="verified-user" size={14} />
          <AppText tone="muted" variant="caption">
            Email được quản lý bởi hệ thống và không thể thay đổi.
          </AppText>
        </XStack>
      </Field>

      <Field error={errors.phoneNumber?.message} label="Số điện thoại">
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { value, onChange, onBlur } }) => (
            <AppInput
              invalid={Boolean(errors.phoneNumber?.message)}
              keyboardType="phone-pad"
              leadingIcon={<IconSymbol color={theme.textSecondary.val} name="phone" size={18} />}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Nhập số điện thoại"
              readOnly={!isEditing}
              value={value}
            />
          )}
        />
      </Field>

      <YStack gap="$2">
        <Field error={errors.location?.message} label="Địa chỉ">
          <Controller
            control={control}
            name="location"
            render={({ field: { value } }) => (
              <AppInput
                invalid={Boolean(errors.location?.message)}
                leadingIcon={<IconSymbol color={theme.textSecondary.val} name="location" size={18} />}
                onChangeText={onLocationChange}
                placeholder="Nhập địa chỉ giao nhận"
                readOnly={!isEditing}
                value={value ?? ""}
              />
            )}
          />
        </Field>

        {isEditing
          ? (
              <LocationSuggestions
                suggestions={locationSuggestions}
                onSelect={onSelectLocationSuggestion}
              />
            )
          : null}
      </YStack>
    </YStack>
  );
}
