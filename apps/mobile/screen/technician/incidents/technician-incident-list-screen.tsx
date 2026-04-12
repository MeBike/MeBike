import { useNavigation } from "@react-navigation/native";
import { spaceScale } from "@theme/metrics";
import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StatusBar } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type { IncidentDetail, IncidentStatus } from "@/contracts/server";
import type { TechnicianIncidentListNavigationProp } from "@/types/navigation";

import { IconSymbol } from "@/components/IconSymbol";
import { useIncidentsInfiniteQuery } from "@/screen/incidents/hooks/use-incidents-infinite-query";
import {
  formatIncidentDistance,
  formatIncidentDuration,
  getIncidentSeverityLabel,
  getIncidentSeverityTone,
  getIncidentStatusLabel,
  getIncidentStatusTone,
  presentIncidentError,
} from "@/screen/incidents/incident-presenters";
import { AppHeroHeader } from "@/ui/patterns/app-hero-header";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { Screen } from "@/ui/primitives/screen";
import { StatusBadge } from "@/ui/primitives/status-badge";

type IncidentTab = "ACTIVE" | "HISTORY";

function formatIncidentCode(incidentId: string) {
  return `SC-${incidentId.slice(-6).toUpperCase()}`;
}

function formatReportedAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatCoordinates(latitude: number | null, longitude: number | null) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function IncidentTabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        opacity: pressed ? 0.98 : 1,
        transform: [{ scale: pressed ? 0.995 : 1 }],
      })}
    >
      {({ pressed }) => (
        <YStack
          alignItems="center"
          backgroundColor={active ? "$surfaceDefault" : "$overlayGlass"}
          borderRadius="$4"
          opacity={pressed ? 0.98 : 1}
          paddingHorizontal="$4"
          paddingVertical="$4"
        >
          <AppText tone={active ? "brand" : "inverted"} variant="tabLabel">
            {label}
          </AppText>
        </YStack>
      )}
    </Pressable>
  );
}

function IncidentRow({
  incident,
  onPress,
}: {
  incident: IncidentDetail;
  onPress: (incidentId: string) => void;
}) {
  const eta = formatIncidentDuration(incident.assignments?.durationSeconds ?? null);
  const distance = formatIncidentDistance(incident.assignments?.distanceMeters ?? null);
  const coordinates = formatCoordinates(incident.latitude, incident.longitude);

  return (
    <Pressable onPress={() => onPress(incident.id)}>
      {({ pressed }) => (
        <AppCard
          borderRadius="$4"
          chrome="whisper"
          gap="$3"
          opacity={pressed ? 0.975 : 1}
          padding="$4"
        >
          <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
            <YStack flex={1} gap="$1">
              <AppText variant="bodyStrong">{incident.incidentType}</AppText>
              <AppText tone="muted" variant="bodySmall">
                {formatIncidentCode(incident.id)}
              </AppText>
            </YStack>
            <StatusBadge
              label={getIncidentStatusLabel(incident.status)}
              pulseDot={incident.status === "OPEN" || incident.status === "IN_PROGRESS"}
              size="compact"
              tone={getIncidentStatusTone(incident.status)}
            />
          </XStack>

          <XStack flexWrap="wrap" gap="$2">
            <StatusBadge
              label={getIncidentSeverityLabel(incident.severity)}
              size="compact"
              tone={getIncidentSeverityTone(incident.severity)}
            />
            {incident.station
              ? <StatusBadge label={incident.station.name} size="compact" tone="neutral" withDot={false} />
              : null}
          </XStack>

          <YStack gap="$2">
            <AppText tone="muted" variant="bodySmall">
              Khách báo:
              {" "}
              {incident.reporterUser.fullName}
            </AppText>
            <AppText tone="muted" variant="bodySmall">
              Xe:
              {" "}
              {incident.bike.chipId}
            </AppText>
            <AppText tone="muted" variant="bodySmall">
              Thời gian báo:
              {" "}
              {formatReportedAt(incident.reportedAt)}
            </AppText>
            {coordinates
              ? (
                  <AppText tone="muted" variant="bodySmall">
                    Vị trí:
                    {" "}
                    {coordinates}
                  </AppText>
                )
              : null}
            {eta || distance
              ? (
                  <AppText tone="muted" variant="bodySmall">
                    {distance ? `Khoảng cách ${distance}` : "Khoảng cách đang cập nhật"}
                    {eta ? `, ETA ${eta}` : ""}
                  </AppText>
                )
              : null}
          </YStack>
        </AppCard>
      )}
    </Pressable>
  );
}

function EmptyState({ description, title }: { description: string; title: string }) {
  const theme = useTheme();

  return (
    <AppCard alignItems="center" borderRadius={32} chrome="whisper" gap="$4" padding="$6">
      <YStack
        alignItems="center"
        backgroundColor="$surfaceAccent"
        borderRadius="$round"
        height={64}
        justifyContent="center"
        width={64}
      >
        <IconSymbol color={theme.textBrand.val} name="warning" size="chip" />
      </YStack>
      <YStack alignItems="center" gap="$2">
        <AppText align="center" variant="headline">
          {title}
        </AppText>
        <AppText align="center" tone="muted" variant="bodySmall">
          {description}
        </AppText>
      </YStack>
    </AppCard>
  );
}

export default function TechnicianIncidentListScreen() {
  const navigation = useNavigation<TechnicianIncidentListNavigationProp>();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<IncidentTab>("ACTIVE");
  const statusFilters = useMemo<Array<IncidentStatus>>(
    () => activeTab === "ACTIVE"
      ? ["OPEN", "ASSIGNED", "IN_PROGRESS"]
      : ["RESOLVED", "CLOSED", "CANCELLED"],
    [activeTab],
  );
  const incidentQuery = useIncidentsInfiniteQuery(
    {
      pageSize: 20,
      statuses: statusFilters,
      sortBy: "resolvedAt",
      sortDir: "desc",
    },
    true,
  );
  const visibleIncidents = incidentQuery.incidents;

  const header = (
    <AppHeroHeader
      footer={(
        <XStack gap="$3">
          <IncidentTabButton
            active={activeTab === "ACTIVE"}
            label="Đang xử lý"
            onPress={() => setActiveTab("ACTIVE")}
          />
          <IncidentTabButton
            active={activeTab === "HISTORY"}
            label="Lịch sử"
            onPress={() => setActiveTab("HISTORY")}
          />
        </XStack>
      )}
      onBack={() => navigation.goBack()}
      size="compact"
      title="Danh sách sự cố"
    />
  );

  if (incidentQuery.isPending) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        {header}
        <YStack padding="$4">
          <EmptyState
            description="Danh sách sự cố đang được tải về từ hệ thống."
            title="Đang tải sự cố"
          />
        </YStack>
      </Screen>
    );
  }

  if (incidentQuery.isError) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        {header}
        <YStack padding="$4">
          <EmptyState
            description={presentIncidentError(incidentQuery.error)}
            title="Không thể tải danh sách sự cố"
          />
        </YStack>
      </Screen>
    );
  }

  return (
    <Screen tone="subtle">
      <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spaceScale[7] }}
        refreshControl={(
          <RefreshControl
            colors={[theme.actionPrimary.val]}
            refreshing={incidentQuery.isRefetching}
            onRefresh={() => {
              void incidentQuery.refetch();
            }}
            tintColor={theme.actionPrimary.val}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <YStack>
          {header}

          <YStack gap="$4" padding="$4">
            {visibleIncidents.length > 0
              ? visibleIncidents.map(incident => (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                    onPress={incidentId => navigation.navigate("TechnicianIncidentDetail", { incidentId })}
                  />
                ))
              : (
                  <EmptyState
                    description={activeTab === "ACTIVE"
                      ? "Hiện chưa có sự cố nào được phân công hoặc đang xử lý."
                      : "Chưa có sự cố đã hoàn tất trong danh sách hiện tại."}
                    title={activeTab === "ACTIVE" ? "Không có sự cố đang xử lý" : "Chưa có lịch sử sự cố"}
                  />
                )}

            {incidentQuery.hasNextPage
              ? (
                  <Pressable
                    onPress={() => {
                      void incidentQuery.fetchNextPage();
                    }}
                  >
                    {({ pressed }) => (
                      <AppCard borderRadius="$4" chrome="flat" opacity={pressed ? 0.975 : 1} padding="$4">
                        <AppText align="center" tone="brand" variant="bodyStrong">
                          {incidentQuery.isFetchingNextPage ? "Đang tải thêm..." : "Tải thêm sự cố"}
                        </AppText>
                      </AppCard>
                    )}
                  </Pressable>
                )
              : null}
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  );
}
