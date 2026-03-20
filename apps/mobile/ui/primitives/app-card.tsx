import { colors } from "@theme/colors";
import { radii, spacing } from "@theme/metrics";
import { styled, YStack } from "tamagui";

export const AppCard = styled(YStack, {
  backgroundColor: "$surface",
  borderRadius: radii.lg,
  borderWidth: 1,
  borderColor: "$borderSubtle",
  padding: spacing.xxl,
  shadowColor: colors.shadowColor,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 5,
  variants: {
    tone: {
      default: {
        backgroundColor: "$surface",
      },
      muted: {
        backgroundColor: "$surfaceMuted",
      },
      accent: {
        backgroundColor: "$surfaceAccent",
      },
    },
    elevated: {
      false: {
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
    },
  } as const,
  defaultVariants: {
    tone: "default",
  },
});
