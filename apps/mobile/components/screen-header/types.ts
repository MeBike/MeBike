import { Ionicons } from "@expo/vector-icons";
import type { ViewStyle, TextStyle } from "react-native";

type GradientColors = readonly [string, string, ...string[]];

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backIconName?: keyof typeof Ionicons.glyphMap;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  gradientColors?: GradientColors;
  variant?: "standard" | "centered" | "hero" | "page";
  bottomPadding?: number;
  style?: ViewStyle;
  titleStyle?: TextStyle;
};
