import { LucideIconSymbol as IconSymbol } from "@components/lucide-icon-symbol";
import { AppText } from "@ui/primitives/app-text";
import { useTheme, XStack } from "tamagui";

import { getRentalCodeLabel } from "../helpers/formatters";

type RentalIdPillProps = {
  rentalId: string;
};

export function RentalIdPill({ rentalId }: RentalIdPillProps) {
  const theme = useTheme();

  return (
    <XStack justifyContent="center" paddingTop="$1">
      <XStack
        alignItems="center"
        backgroundColor="$surfaceAccent"
        borderRadius="$round"
        gap="$2"
        paddingHorizontal="$6"
        paddingVertical="$3"
      >
        <AppText tone="muted" variant="value">
          Mã thuê:
          {" "}
          {getRentalCodeLabel(rentalId)}
        </AppText>
        <IconSymbol color={theme.textSecondary.val} name="doc.on.doc" size={18} />
      </XStack>
    </XStack>
  );
}
