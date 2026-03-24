import { IconSymbol } from "@components/IconSymbol";
import { colors } from "@theme/colors";
import { AppText } from "@ui/primitives/app-text";
import { XStack } from "tamagui";

import { getRentalCodeLabel } from "../helpers/formatters";

type RentalIdPillProps = {
  rentalId: string;
};

export function RentalIdPill({ rentalId }: RentalIdPillProps) {
  return (
    <XStack justifyContent="center" paddingTop="$2">
      <XStack
        alignItems="center"
        backgroundColor="$surfaceMuted"
        borderRadius="$round"
        gap="$2"
        paddingHorizontal="$5"
        paddingVertical="$3"
      >
        <AppText tone="muted" variant="eyebrow">
          Mã thuê:
          {" "}
          {getRentalCodeLabel(rentalId)}
        </AppText>
        <IconSymbol color={colors.textMuted} name="doc.on.doc" size={16} />
      </XStack>
    </XStack>
  );
}
