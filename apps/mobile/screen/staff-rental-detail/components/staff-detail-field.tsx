import { borderWidths } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { Separator, YStack } from "tamagui";

type StaffDetailFieldProps = {
  label: string;
  value?: string | null;
  tone?: "default" | "muted" | "success" | "warning" | "danger";
  multiline?: boolean;
  withSeparator?: boolean;
};

export function StaffDetailField({
  label,
  value,
  tone = "default",
  multiline = false,
  withSeparator = true,
}: StaffDetailFieldProps) {
  return (
    <YStack gap="$2">
      <YStack gap="$1">
        <AppText tone="muted" variant="meta">
          {label}
        </AppText>
        <AppText
          numberOfLines={multiline ? undefined : 2}
          tone={tone}
          variant="compactStrong"
        >
          {value && value.trim().length > 0 ? value : "--"}
        </AppText>
      </YStack>

      {withSeparator ? <Separator borderColor="$borderSubtle" borderWidth={borderWidths.subtle} /> : null}
    </YStack>
  );
}
