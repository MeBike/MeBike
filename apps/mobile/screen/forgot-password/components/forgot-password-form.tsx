import type { Control, FieldErrors } from "react-hook-form";

import { Ionicons } from "@expo/vector-icons";
import { Controller } from "react-hook-form";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { ForgotPasswordSchemaFormData } from "@schemas/authSchema";

import { BikeColors } from "../../../constants/BikeColors";

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BikeColors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: BikeColors.textPrimary,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

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
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <View style={styles.inputWithIcon}>
          <Ionicons name="mail" size={20} color={BikeColors.textSecondary} />
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

      <Pressable
        style={[styles.button, isSubmitting && styles.disabledButton]}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? "Đang gửi..." : "Xác nhận"}
        </Text>
      </Pressable>
    </View>
  );
}
