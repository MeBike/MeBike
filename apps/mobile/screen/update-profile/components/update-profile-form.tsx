import type { Control, FieldErrors } from "react-hook-form";

import { IconSymbol } from "@components/IconSymbol";
import { BikeColors } from "@constants/BikeColors";
import { Controller } from "react-hook-form";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { TomTomAddressSuggestion } from "../lib/tomtom";
import type { UpdateProfileFormValues } from "../schema";

import { LocationSuggestions } from "./location-suggestions";

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
  inputDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 6,
  },
  actions: {
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: BikeColors.divider,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: BikeColors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

type UpdateProfileFormProps = {
  control: Control<UpdateProfileFormValues>;
  errors: FieldErrors<UpdateProfileFormValues>;
  email: string;
  isEditing: boolean;
  isSaving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onLocationChange: (value: string) => void;
  locationSuggestions: TomTomAddressSuggestion[];
  onSelectLocationSuggestion: (item: TomTomAddressSuggestion) => void;
};

export function UpdateProfileForm({
  control,
  errors,
  email,
  isEditing,
  isSaving,
  onSubmit,
  onCancel,
  onLocationChange,
  locationSuggestions,
  onSelectLocationSuggestion,
}: UpdateProfileFormProps) {
  return (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Họ và tên</Text>
        <View style={[styles.inputWithIcon, !isEditing && styles.inputDisabled]}>
          <IconSymbol name="person" size={20} color={BikeColors.textSecondary} />
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
                editable={isEditing}
                autoCapitalize="words"
              />
            )}
          />
        </View>
        {errors.fullname?.message ? <Text style={styles.errorText}>{errors.fullname.message}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Username</Text>
        <View style={[styles.inputWithIcon, !isEditing && styles.inputDisabled]}>
          <IconSymbol name="person" size={20} color={BikeColors.textSecondary} />
          <Controller
            control={control}
            name="username"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={styles.input}
                placeholder="Nhập username"
                placeholderTextColor={BikeColors.textSecondary}
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={isEditing}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
        </View>
        {errors.username?.message ? <Text style={styles.errorText}>{errors.username.message}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <View style={[styles.inputWithIcon, styles.inputDisabled]}>
          <IconSymbol name="envelope" size={20} color={BikeColors.textSecondary} />
          <TextInput
            style={styles.input}
            value={email}
            editable={false}
            placeholder="Email"
            placeholderTextColor={BikeColors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Số điện thoại</Text>
        <View style={[styles.inputWithIcon, !isEditing && styles.inputDisabled]}>
          <IconSymbol name="phone" size={20} color={BikeColors.textSecondary} />
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={BikeColors.textSecondary}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={isEditing}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            )}
          />
        </View>
        {errors.phoneNumber?.message ? <Text style={styles.errorText}>{errors.phoneNumber.message}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Địa chỉ</Text>
        <View style={[styles.inputWithIcon, !isEditing && styles.inputDisabled]}>
          <IconSymbol name="location" size={20} color={BikeColors.textSecondary} />
          <Controller
            control={control}
            name="location"
            render={({ field: { value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Nhập địa chỉ"
                placeholderTextColor={BikeColors.textSecondary}
                value={value ?? ""}
                onChangeText={onLocationChange}
                editable={isEditing}
              />
            )}
          />
        </View>
        {errors.location?.message ? <Text style={styles.errorText}>{errors.location.message}</Text> : null}
        {isEditing
          ? (
              <LocationSuggestions
                suggestions={locationSuggestions}
                onSelect={onSelectLocationSuggestion}
              />
            )
          : null}
      </View>

      {isEditing
        ? (
            <View style={styles.actions}>
              <Pressable
                style={[styles.primaryButton, isSaving && styles.disabledButton]}
                onPress={onSubmit}
                disabled={isSaving}
              >
                <Text style={styles.primaryButtonText}>
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryButton, isSaving && styles.disabledButton]}
                onPress={onCancel}
                disabled={isSaving}
              >
                <Text style={styles.secondaryButtonText}>Hủy</Text>
              </Pressable>
            </View>
          )
        : null}
    </View>
  );
}
