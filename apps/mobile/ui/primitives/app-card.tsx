import { styled, YStack } from "tamagui";

import { borderWidths, elevations } from "@theme/metrics";

export const AppCard = styled(YStack, {
  backgroundColor: "$surfaceDefault",
  borderRadius: "$3",
  borderWidth: borderWidths.subtle,
  borderColor: "$borderSubtle",
  padding: "$5",
  shadowColor: "$shadowColor",
  shadowOffset: elevations.medium.shadowOffset,
  shadowOpacity: elevations.medium.shadowOpacity,
  shadowRadius: elevations.medium.shadowRadius,
  elevation: elevations.medium.elevation,
  variants: {
    tone: {
      default: {
        backgroundColor: "$surfaceDefault",
      },
      muted: {
        backgroundColor: "$surfaceMuted",
      },
      accent: {
        backgroundColor: "$surfaceAccent",
      },
      success: {
        backgroundColor: "$surfaceSuccess",
      },
      warning: {
        backgroundColor: "$surfaceWarning",
      },
      danger: {
        backgroundColor: "$surfaceDanger",
      },
      inverse: {
        backgroundColor: "$surfaceInverse",
        borderColor: "$surfaceInverse",
      },
    },
    size: {
      compact: {
        padding: "$4",
      },
      default: {
        padding: "$5",
      },
      spacious: {
        padding: "$6",
      },
    },
    elevated: {
      false: {
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
    },
  } as const,
  defaultVariants: {
    tone: "default",
    size: "default",
  },
});
