import type { ReactNode } from "react";
import type { ModalProps, StyleProp, ViewStyle } from "react-native";

import { elevations, radii } from "@theme/metrics";
import { AppCard } from "@ui/primitives/app-card";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "tamagui";

type SheetDimension = number | `${number}%`;

type AppBottomModalCardProps = {
  animationType?: ModalProps["animationType"];
  cardStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
  height?: SheetDimension;
  isVisible: boolean;
  maxHeight?: SheetDimension;
  onClose: () => void;
  variant?: "card" | "sheet";
};

export function AppBottomModalCard({
  animationType,
  cardStyle,
  children,
  containerStyle,
  height,
  isVisible,
  maxHeight,
  onClose,
  variant = "card",
}: AppBottomModalCardProps) {
  const theme = useTheme();
  const isSheet = variant === "sheet";
  const resolvedContainerStyle = StyleSheet.flatten([
    isSheet
      ? {
          justifyContent: "flex-end" as const,
          width: "100%" as const,
          ...(height ? { height } : null),
        }
      : null,
    containerStyle,
  ]);
  const resolvedCardStyle = StyleSheet.flatten([
    isSheet
      ? {
          ...elevations.medium,
          borderTopLeftRadius: radii.xxl,
          borderTopRightRadius: radii.xxl,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          marginBottom: 0,
          marginHorizontal: 0,
          width: "100%" as const,
          ...(maxHeight ? { maxHeight } : null),
        }
      : elevations.medium,
    cardStyle,
  ]);

  return (
    <Modal
      animationType={animationType ?? (isSheet ? "slide" : "fade")}
      onRequestClose={onClose}
      transparent
      visible={isVisible}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={onClose}
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: theme.overlayScrim.val,
            },
          ]}
        />

        <View
          pointerEvents="box-none"
          style={isSheet
            ? {
                flex: 1,
                justifyContent: "flex-end",
              }
            : {
                flex: 1,
                justifyContent: "flex-end",
              }}
        >
          <View style={resolvedContainerStyle}>
            <AppCard
              chrome="flat"
              overflow="hidden"
              padding="$0"
              {...(isSheet
                ? { margin: "$0" }
                : { borderRadius: "$5", margin: "$4" })}
              style={StyleSheet.flatten([
                resolvedCardStyle,
                isSheet && height ? { flex: 1 } : null,
              ])}
            >
              {children}
            </AppCard>
          </View>
        </View>
      </View>
    </Modal>
  );
}
