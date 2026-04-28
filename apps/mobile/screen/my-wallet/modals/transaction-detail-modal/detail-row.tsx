import { IconSymbol } from "@components/IconSymbol";
import { AppText } from "@ui/primitives/app-text";
import { Pressable, View } from "react-native";

import type { createTransactionDetailModalStyles } from "./styles";

type DetailRowProps = {
  label: string;
  value: string;
  valueTone?: "success" | "warning" | "danger" | "default";
  showToggle?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  styles: ReturnType<typeof createTransactionDetailModalStyles>;
  copyIconColor: string;
};

export function DetailRow({
  label,
  value,
  valueTone = "default",
  showToggle = false,
  expanded = false,
  onToggle,
  styles,
  copyIconColor,
}: DetailRowProps) {
  return (
    <View style={styles.row}>
      <AppText style={styles.label} variant="body">
        {label}
      </AppText>

      <View style={styles.valueGroup}>
        <AppText
          numberOfLines={expanded ? undefined : 1}
          style={[
            styles.value,
            valueTone === "success" ? styles.valueSuccess : null,
            valueTone === "warning" ? styles.valueWarning : null,
            valueTone === "danger" ? styles.valueDanger : null,
          ]}
          variant="body"
        >
          {value}
        </AppText>

        {showToggle && onToggle
          ? (
              <Pressable onPress={onToggle} style={({ pressed }) => [styles.copyButton, pressed ? styles.copyButtonPressed : null]}>
                <IconSymbol color={copyIconColor} name="copy" size="sm" />
              </Pressable>
            )
          : null}
      </View>
    </View>
  );
}
