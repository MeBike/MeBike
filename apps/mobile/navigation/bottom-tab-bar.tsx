import type { BottomTabBarProps, BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import type { LucideIcon } from "lucide-react-native";

import {
  CalendarDays,
  House,
  Map,
  UserRound,
  Wallet,
  Wrench,
} from "lucide-react-native";
import React from "react";
import { Button, useTheme, View, XStack, YStack } from "tamagui";

import { borderWidths, iconSizes, spaceScale } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";

const routeIcons: Record<string, LucideIcon> = {
  "Nhà": House,
  "Trạm": Map,
  "Booking": CalendarDays,
  "Ví": Wallet,
  "Tôi": UserRound,
  "Công cụ": Wrench,
};

function resolveTabLabel(options: BottomTabNavigationOptions, routeName: string) {
  if (typeof options.tabBarLabel === "string") {
    return options.tabBarLabel;
  }

  if (typeof options.title === "string" && options.title.length > 0) {
    return options.title;
  }

  return routeName;
}

function isTabBarHidden(tabBarStyle: unknown): boolean {
  if (Array.isArray(tabBarStyle)) {
    return tabBarStyle.some(styleEntry => isTabBarHidden(styleEntry));
  }

  if (!tabBarStyle || typeof tabBarStyle !== "object") {
    return false;
  }

  return (tabBarStyle as { display?: string }).display === "none";
}

export function BottomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const activeRoute = state.routes[state.index];
  const activeOptions = descriptors[activeRoute.key]?.options;

  if (isTabBarHidden(activeOptions?.tabBarStyle)) {
    return null;
  }

  return (
    <YStack
      backgroundColor="$surfaceDefault"
      borderTopColor="$borderSubtle"
      borderTopWidth={borderWidths.subtle}
      paddingTop="$2"

      paddingBottom={insets.bottom + spaceScale[1]}
    >
      <XStack alignItems="flex-start">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = resolveTabLabel(options, route.name);
          const Icon = routeIcons[route.name] ?? House;
          const iconColor = isFocused ? theme.actionPrimary.val : theme.textSecondary.val;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Button
              key={route.key}
              unstyled
              accessibilityLabel={options.tabBarAccessibilityLabel}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              alignItems="center"
              backgroundColor="transparent"
              borderRadius="$4"
              flex={1}
              flexDirection="column"
              gap="$1"
              justifyContent="center"
              minWidth={0}
              onLongPress={onLongPress}
              onPress={onPress}
              paddingBottom="$0"
              paddingHorizontal="$1"
              paddingTop="$1"
              pressStyle={{
                backgroundColor: "$surfaceAccent",
                opacity: 1,
              }}
              testID={options.tabBarButtonTestID}
            >
              <View
                alignItems="center"
                height={spaceScale[6]}
                justifyContent="center"
                width="100%"
              >
                <Icon color={iconColor} size={iconSizes.lg} />
              </View>

              <View alignItems="center" height={spaceScale[5]} justifyContent="center" width="100%">
                <AppText
                  align="center"
                  numberOfLines={1}
                  tone={isFocused ? "brand" : "muted"}
                  variant="label"
                >
                  {label}
                </AppText>
              </View>

              <View alignItems="center" height={spaceScale[2]} justifyContent="flex-end" width="100%">
                <View
                  backgroundColor={isFocused ? "$actionPrimary" : "transparent"}
                  borderRadius="$round"
                  height={spaceScale[1]}
                  width={spaceScale[7]}
                />
              </View>
            </Button>
          );
        })}
      </XStack>
    </YStack>
  );
}
