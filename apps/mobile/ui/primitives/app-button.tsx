import type { ReactNode } from "react";
import type { GetProps } from "tamagui";

import { borderWidths, radii } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { Button, Spinner } from "tamagui";

type AppButtonTone = "primary" | "secondary" | "soft" | "ghost" | "outline";

type AppButtonProps = Omit<GetProps<typeof Button>, "children"> & {
  children: ReactNode;
  loading?: boolean;
  tone?: AppButtonTone;
};

const buttonToneStyles: Record<AppButtonTone, { bg: string; borderColor: string; textTone: "inverted" | "brand" | "muted" }> = {
  primary: {
    bg: "$brandPrimary",
    borderColor: "$brandPrimary",
    textTone: "inverted",
  },
  secondary: {
    bg: "$brandSecondary",
    borderColor: "$brandSecondary",
    textTone: "inverted",
  },
  soft: {
    bg: "$surfaceAccent",
    borderColor: "$surfaceAccent",
    textTone: "brand",
  },
  ghost: {
    bg: "transparent",
    borderColor: "transparent",
    textTone: "brand",
  },
  outline: {
    bg: "$surface",
    borderColor: "$brandPrimary",
    textTone: "brand",
  },
};

export function AppButton({
  children,
  loading = false,
  tone = "primary",
  disabled,
  ...props
}: AppButtonProps) {
  const style = buttonToneStyles[tone];

  return (
    <Button
      backgroundColor={style.bg}
      borderColor={style.borderColor}
      borderRadius={radii.lg}
      borderWidth={tone === "ghost" ? borderWidths.none : tone === "outline" ? borderWidths.strong : borderWidths.subtle}
      disabled={disabled || loading}
      disabledStyle={{ opacity: 0.58 }}
      height={52}
      justifyContent="center"
      shadowColor={tone === "ghost" ? "transparent" : "$shadowColor"}
      shadowOffset={tone === "ghost" ? undefined : { width: 0, height: 5 }}
      shadowOpacity={tone === "ghost" ? 0 : 0.15}
      shadowRadius={tone === "ghost" ? 0 : 15}
      elevation={tone === "ghost" ? 0 : 3}
      pressStyle={{ opacity: 0.92, scale: 0.985 }}
      {...props}
    >
      {loading ? <Spinner color={style.textTone === "inverted" ? "$textOnBrand" : "$brandPrimary"} /> : null}
      {typeof children === "string"
        ? (
            <AppText align="center" tone={style.textTone} variant="bodySmall">
              {children}
            </AppText>
          )
        : children}
    </Button>
  );
}
