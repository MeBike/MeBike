import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { Screen } from "@ui/primitives/screen";
import { useNavigation, useRoute } from "@react-navigation/native";
import React from "react";
import { Pressable } from "react-native";
import { useTheme, YStack } from "tamagui";

import { IconSymbol } from "@/components/IconSymbol";
import type {
  FixedSlotTemplatesNavigationProp,
  FixedSlotTemplatesRouteProp,
} from "@/types/navigation";

import { FixedSlotTemplatesList } from "./components/templates-list";
import { useFixedSlotTemplatesScreen } from "./use-fixed-slot-templates-screen";

export default function FixedSlotTemplatesScreen() {
  const navigation = useNavigation<FixedSlotTemplatesNavigationProp>();
  const route = useRoute<FixedSlotTemplatesRouteProp>();
  const theme = useTheme();
  const {
    headerTitle,
    listHeight,
    setListHeight,
    templates,
    isLoading,
    isRefreshing,
    isFetchingMore,
    hasNextPage,
    handleCreateTemplate,
    handleRefresh,
    handleLoadMore,
    handleSelectTemplate,
  } = useFixedSlotTemplatesScreen({ navigation, routeParams: route.params });

  return (
    <Screen tone="subtle">
      <AppHeroHeader
        accessory={(
          <Pressable onPress={handleCreateTemplate}>
            {({ pressed }) => (
              <YStack
                alignItems="center"
                backgroundColor="$overlayGlass"
                borderRadius="$round"
                height={40}
                justifyContent="center"
                opacity={pressed ? 0.85 : 1}
                width={40}
              >
                <IconSymbol color={theme.onSurfaceBrand.val} name="plus" size="md" />
              </YStack>
            )}
          </Pressable>
        )}
        size="compact"
        title={headerTitle}
        variant="gradient"
      />
      <YStack flex={1}>
        <YStack
          flex={1}
          onLayout={({ nativeEvent }) => {
            setListHeight(nativeEvent.layout.height);
          }}
        >
          <FixedSlotTemplatesList
            templates={templates}
            refreshing={isRefreshing}
            isLoading={isLoading}
            isFetchingMore={isFetchingMore}
            hasNextPage={hasNextPage}
            containerHeight={listHeight}
            onRefresh={handleRefresh}
            onLoadMore={handleLoadMore}
            onSelect={handleSelectTemplate}
          />
        </YStack>
      </YStack>
    </Screen>
  );
}
