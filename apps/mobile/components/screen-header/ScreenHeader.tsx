import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { screenHeaderStyles as styles } from "./styles";
import type { ScreenHeaderProps } from "./types";

const DEFAULT_GRADIENT: readonly [string, string] = ["#0066FF", "#00B4D8"];

function StandardHeader({
  title,
  titleStyle,
  showBackButton,
  backIconName,
  onBackPress,
  rightAction,
  gradientColors,
  bottomPadding,
  style,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  const renderBackButton = () => {
    if (showBackButton === false || !onBackPress) return null;
    return (
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBackPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name={backIconName ?? "chevron-back"} size={24} color="#fff" />
      </TouchableOpacity>
    );
  };

  const renderRightAction = () => {
    if (!rightAction) {
      if (showBackButton !== false && onBackPress) {
        return <View style={styles.placeholder} />;
      }
      return null;
    }
    return <View style={styles.rightAction}>{rightAction}</View>;
  };

  return (
    <LinearGradient
      colors={gradientColors ?? DEFAULT_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.standardHeader,
        { paddingTop: insets.top + 16, paddingBottom: bottomPadding ?? 16 },
        style,
      ]}
    >
      {renderBackButton()}
      <Text style={[styles.standardTitle, titleStyle]}>{title}</Text>
      {renderRightAction()}
    </LinearGradient>
  );
}

function CenteredHeader({
  title,
  subtitle,
  titleStyle,
  gradientColors,
  bottomPadding,
  style,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradientColors ?? DEFAULT_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.centeredHeader,
        { paddingTop: insets.top + 32, paddingBottom: (bottomPadding ?? 16) + 22 },
        style,
      ]}
    >
      <Text style={[styles.centeredTitle, titleStyle]}>{title}</Text>
      {subtitle && <Text style={styles.centeredSubtitle}>{subtitle}</Text>}
    </LinearGradient>
  );
}

function HeroHeader({
  title,
  subtitle,
  titleStyle,
  showBackButton,
  backIconName,
  onBackPress,
  gradientColors,
  bottomPadding,
  style,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradientColors ?? DEFAULT_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.heroHeader,
        { paddingTop: insets.top + 32, paddingBottom: (bottomPadding ?? 16) + 22 },
        style,
      ]}
    >
      {showBackButton !== false && onBackPress && (
        <TouchableOpacity style={styles.heroBackButton} onPress={onBackPress}>
          <Ionicons name={backIconName ?? "chevron-back"} size={20} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={styles.heroContent}>
        <Text style={[styles.heroTitle, titleStyle]}>{title}</Text>
        {subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
      </View>
    </LinearGradient>
  );
}

function PageHeader({
  title,
  subtitle,
  titleStyle,
  gradientColors,
  bottomPadding,
  style,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradientColors ?? DEFAULT_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.pageHeader,
        { paddingTop: insets.top + 16, paddingBottom: (bottomPadding ?? 16) + 8 },
        style,
      ]}
    >
      <Text style={[styles.pageTitle, titleStyle]}>{title}</Text>
      {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
    </LinearGradient>
  );
}

export function ScreenHeader(props: ScreenHeaderProps) {
  const { variant = "standard" } = props;

  switch (variant) {
    case "hero":
      return <HeroHeader {...props} />;
    case "centered":
      return <CenteredHeader {...props} />;
    case "page":
      return <PageHeader {...props} />;
    default:
      return <StandardHeader {...props} />;
  }
}

export default ScreenHeader;
