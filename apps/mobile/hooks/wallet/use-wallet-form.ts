import { useCallback, useState } from "react";
import { Alert } from "react-native";

type FormField = {
  value: string;
  error?: string;
};

type UseWalletFormReturn = {
  fields: Record<string, FormField>;
  updateField: (fieldName: string, value: string) => void;
  validateField: (fieldName: string, validator: (value: string) => { isValid: boolean; message?: string }) => boolean;
  resetForm: () => void;
};

export function useWalletForm(initialFields: Record<string, string> = {}): UseWalletFormReturn {
  const [fields, setFields] = useState<Record<string, FormField>>(
    Object.keys(initialFields).reduce((acc, key) => {
      acc[key] = { value: initialFields[key] || "" };
      return acc;
    }, {} as Record<string, FormField>),
  );

  const updateField = useCallback((fieldName: string, value: string) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], value, error: undefined },
    }));
  }, []);

  const validateField = useCallback((fieldName: string, validator: (value: string) => { isValid: boolean; message?: string }): boolean => {
    const field = fields[fieldName];
    if (!field)
      return false;

    const validation = validator(field.value);
    if (!validation.isValid) {
      setFields(prev => ({
        ...prev,
        [fieldName]: { ...prev[fieldName], error: validation.message },
      }));
      return false;
    }

    setFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], error: undefined },
    }));
    return true;
  }, [fields]);

  const resetForm = useCallback(() => {
    setFields(
      Object.keys(initialFields).reduce((acc, key) => {
        acc[key] = { value: initialFields[key] || "" };
        return acc;
      }, {} as Record<string, FormField>),
    );
  }, [initialFields]);

  return {
    fields,
    updateField,
    validateField,
    resetForm,
  };
}

export function showAlert(title: string, message: string) {
  Alert.alert(title, message);
}
