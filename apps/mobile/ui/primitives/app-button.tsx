import type { ReactNode } from "react";
import type { GetProps } from "tamagui";

import { Button, Spinner, styled } from "tamagui";

import type { AppTextTone } from "@ui/primitives/app-text";

import { borderWidths } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

export type AppButtonTone = "primary" | "secondary" | "soft" | "ghost" | "outline" | "danger";
export type AppButtonSize = "compact" | "default" | "large";

const AppButtonFrame = styled(Button, {
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "$3",
  borderWidth: borderWidths.subtle,
  paddingHorizontal: "$4",
  gap: "$2",
  height: "$6",
  backgroundColor: "$actionPrimary",
  borderColor: "$actionPrimary",
  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 3,
  disabledStyle: { opacity: 0.58 },
  variants: {
    tone: {
      primary: {
        backgroundColor: "$actionPrimary",
        borderColor: "$actionPrimary",
        pressStyle: {
          backgroundColor: "$actionPrimaryPress",
          borderColor: "$actionPrimaryPress",
          opacity: 1,
          scale: 0.985,
        },
      },
      secondary: {
        backgroundColor: "$actionSecondary",
        borderColor: "$actionSecondary",
        pressStyle: {
          backgroundColor: "$actionSecondaryPress",
          borderColor: "$actionSecondaryPress",
          opacity: 1,
          scale: 0.985,
        },
      },
      soft: {
        backgroundColor: "$surfaceAccent",
        borderColor: "$surfaceAccent",
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        pressStyle: {
          backgroundColor: "$surfaceAccentPress",
          borderColor: "$surfaceAccentPress",
          opacity: 1,
          scale: 0.985,
        },
      },
      ghost: {
        backgroundColor: "$actionGhost",
        borderColor: "$actionGhost",
        borderWidth: borderWidths.none,
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        pressStyle: {
          backgroundColor: "$actionGhostPress",
          borderColor: "$actionGhostPress",
          opacity: 1,
          scale: 0.985,
        },
      },
      outline: {
        backgroundColor: "$surfaceDefault",
        borderColor: "$borderFocus",
        borderWidth: borderWidths.strong,
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        pressStyle: {
          backgroundColor: "$surfaceAccent",
          borderColor: "$borderFocus",
          opacity: 1,
          scale: 0.985,
        },
      },
      danger: {
        backgroundColor: "$actionDanger",
        borderColor: "$actionDanger",
        pressStyle: {
          backgroundColor: "$actionDangerPress",
          borderColor: "$actionDangerPress",
          opacity: 1,
          scale: 0.985,
        },
      },
    },
    buttonSize: {
      compact: {
        height: "$5",
        paddingHorizontal: "$3",
      },
      default: {
        height: "$6",
        paddingHorizontal: "$4",
      },
      large: {
        height: "$7",
        paddingHorizontal: "$5",
      },
    },
  } as const,
  defaultVariants: {
    tone: "primary",
    buttonSize: "default",
  },
});

type AppButtonProps = Omit<GetProps<typeof AppButtonFrame>, "children" | "size"> & {
  children: ReactNode;
  buttonSize?: AppButtonSize;
  loading?: boolean;
};

function getTextTone(tone: AppButtonTone): AppTextTone {
  switch (tone) {
    case "primary":
    case "secondary":
      return "inverted";
    case "danger":
      return "inverted";
    case "soft":
    case "ghost":
    case "outline":
      return "brand";
  }
}

function getSpinnerColor(tone: AppButtonTone) {
  switch (tone) {
    case "primary":
      return "$onActionPrimary" as const;
    case "secondary":
      return "$onActionSecondary" as const;
    case "danger":
      return "$onActionDanger" as const;
    case "soft":
    case "ghost":
    case "outline":
      return "$textBrand" as const;
  }
}

export function AppButton({
  buttonSize = "default",
  children,
  loading = false,
  tone = "primary",
  disabled,
  ...props
}: AppButtonProps) {
  const textTone = getTextTone(tone);

  return (
    <AppButtonFrame
      buttonSize={buttonSize}
      disabled={disabled || loading}
      tone={tone}
      {...props}
    >
      {loading ? <Spinner color={getSpinnerColor(tone)} /> : null}
      {typeof children === "string"
        ? (
            <AppText align="center" tone={textTone} variant="bodySmall">
              {children}
            </AppText>
          )
        : children}
    </AppButtonFrame>
  );
}
