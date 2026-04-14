import { useNavigation, useRoute } from "@react-navigation/native";
import { AppButton } from "@ui/primitives/app-button";
import { AppCard } from "@ui/primitives/app-card";
import { AppText } from "@ui/primitives/app-text";
import { AppHeroHeader } from "@ui/patterns/app-hero-header";
import { Screen } from "@ui/primitives/screen";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useTheme, YStack } from "tamagui";

import { useFixedSlotTemplateDetailQuery } from "@hooks/query/fixed-slots/use-fixed-slot-template-detail-query";
import { getFixedSlotStatusTone, presentFixedSlotStatus } from "@/presenters/fixed-slots/fixed-slot-presenter";
import { StatusBadge } from "@/ui/primitives/status-badge";

import { DateChips } from "./fixed-slot-detail/components/date-chips";
import { InfoHighlights } from "./fixed-slot-detail/components/info-highlights";
import { StationSummary } from "./fixed-slot-detail/components/station-summary";

import type {
  FixedSlotDetailNavigationProp,
  FixedSlotDetailRouteProp,
} from "@/types/navigation";

export default function FixedSlotDetailScreen() {
  const navigation = useNavigation<FixedSlotDetailNavigationProp>();
  const route = useRoute<FixedSlotDetailRouteProp>();
  const { templateId } = route.params;
  const theme = useTheme();

  const { data, isLoading } = useFixedSlotTemplateDetailQuery(templateId, true);
  const statusTone = data ? getFixedSlotStatusTone(data.status) : undefined;
  const statusLabel = data ? presentFixedSlotStatus(data.status) : undefined;

  return (
    <Screen tone="subtle">
      <AppHeroHeader
        accessory={statusLabel && statusTone
          ? <StatusBadge label={statusLabel} size="compact" tone={statusTone} withDot />
          : undefined}
        onBack={() => navigation.goBack()}
        size="compact"
        subtitle={data?.station.name}
        title="Chi tiết khung giờ"
        variant="surface"
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {isLoading || !data
          ? (
              <Screen alignItems="center" justifyContent="center" minHeight={280} tone="subtle">
                <ActivityIndicator color={theme.actionPrimary.val} size="large" />
              </Screen>
            )
          : (
              <YStack gap="$4">
                <AppCard borderColor="$borderSubtle" borderWidth={1} borderRadius="$5" chrome="flat" gap="$4">
                  <StationSummary
                    name={data.station.name}
                    stationId={data.station.id}
                    status={data.status}
                  />
                  <InfoHighlights slotStart={data.slotStart} totalDates={data.slotDates.length} />
                </AppCard>

                <AppCard borderColor="$borderSubtle" borderWidth={1} borderRadius="$5" chrome="flat" gap="$4">
                  <YStack gap="$1">
                    <AppText variant="sectionTitle">Danh sách ngày</AppText>
                    <AppText tone="muted" variant="caption">{data.slotDates.length} ngày đã chọn</AppText>
                  </YStack>
                  <DateChips dates={data.slotDates} />
                </AppCard>

                {data.status === "ACTIVE"
                  ? (
                      <AppButton
                        onPress={() =>
                          navigation.navigate("FixedSlotEditor", {
                            templateId,
                            stationId: data.station.id,
                            stationName: data.station.name,
                          })}
                        tone="primary"
                      >
                        Chỉnh sửa khung giờ
                      </AppButton>
                    )
                  : null}
              </YStack>
            )}
      </ScrollView>
    </Screen>
  );
}
