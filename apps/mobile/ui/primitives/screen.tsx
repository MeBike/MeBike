import { styled, YStack } from "tamagui";

export const Screen = styled(YStack, {
  backgroundColor: "$backgroundCanvas",
  flex: 1,
  variants: {
    tone: {
      canvas: {
        backgroundColor: "$backgroundCanvas",
      },
      subtle: {
        backgroundColor: "$backgroundSubtle",
      },
      raised: {
        backgroundColor: "$backgroundRaised",
      },
    },
    inset: {
      none: {},
      default: {
        paddingHorizontal: "$4",
      },
      wide: {
        paddingHorizontal: "$5",
      },
    },
    paddedY: {
      false: {},
      true: {
        paddingVertical: "$4",
      },
    },
  } as const,
  defaultVariants: {
    tone: "canvas",
    inset: "none",
    paddedY: false,
  },
});
