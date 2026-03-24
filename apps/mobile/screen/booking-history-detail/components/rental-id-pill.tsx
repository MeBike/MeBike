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
        <IconSymbol color={colors.textSecondary} name="doc.on.doc" size={18} />
      </XStack>
    </XStack>
  );
}
