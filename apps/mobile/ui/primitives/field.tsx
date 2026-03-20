import type { ReactNode } from "react";

import { AppText } from "@ui/primitives/app-text";
import { YStack } from "tamagui";

type FieldProps = {
  label?: string;
  description?: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, description, error, children }: FieldProps) {
  return (
    <YStack gap="$2">
      {label ? <AppText tone="muted" paddingLeft={6} variant="fieldLabel">{label}</AppText> : null}
      {children}
      {error
        ? <AppText tone="danger" variant="caption">{error}</AppText>
        : description
          ? <AppText tone="muted" variant="caption">{description}</AppText>
          : null}
    </YStack>
  );
}
