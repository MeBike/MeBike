import { useNavigation, useRoute } from "@react-navigation/native";
import { spaceScale } from "@theme/metrics";
import React, { useState } from "react";
import { RefreshControl, ScrollView, StatusBar } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type {
  TechnicianIncidentDetailNavigationProp,
  TechnicianIncidentDetailRouteProp,
} from "@/types/navigation";

import { AppHeroHeader } from "@/ui/patterns/app-hero-header";
import { AppCard } from "@/ui/primitives/app-card";
import { AppText } from "@/ui/primitives/app-text";
import { Screen } from "@/ui/primitives/screen";
import { StatusBadge } from "@/ui/primitives/status-badge";

import { useIncidentDetailQuery } from "../../rental/incidents/hooks/use-incident-detail-query";
import {
  formatIncidentDistance,
  formatIncidentDuration,
  getIncidentSeverityLabel,
  getIncidentSeverityTone,
  getIncidentSourceLabel,
  getIncidentStatusLabel,
  getIncidentStatusTone,
  presentIncidentError,
} from "../../rental/incidents/incident-presenters";
import { TechnicianIncidentActionBar } from "./components/technician-incident-action-bar";
import { useTechnicianIncidentActions } from "./hooks/use-technician-incident-actions";

function formatIncidentCode(incidentId: string) {
  return `SC-${incidentId.slice(-6).toUpperCase()}`;
}

function formatDateTime(value: Date | string | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCoordinates(latitude: number | null, longitude: number | null) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText tone="subtle" variant="eyebrow">
      {children}
    </AppText>
  );
}

function DetailLine({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) {
    return null;
  }

  return (
    <YStack gap="$1">
      <AppText tone="muted" variant="caption">
        {label}
      </AppText>
      <AppText variant="bodySmall">{value}</AppText>
    </YStack>
  );
}

function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <AppCard borderRadius="$4" chrome="flat" gap="$2" padding="$5">
      <AppText variant="bodyStrong">{title}</AppText>
      <AppText tone="muted" variant="bodySmall">
        {description}
      </AppText>
    </AppCard>
  );
}

export default function TechnicianIncidentDetailScreen() {
  const navigation = useNavigation<TechnicianIncidentDetailNavigationProp>();
  const route = useRoute<TechnicianIncidentDetailRouteProp>();
  const theme = useTheme();
  const { incidentId } = route.params;
  const incidentQuery = useIncidentDetailQuery(incidentId, true);
  const incident = incidentQuery.data;
  const [contentHeight, setContentHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const header = (
    <AppHeroHeader
      onBack={() => navigation.goBack()}
      size="default"
      subtitle={formatIncidentCode(incidentId)}
      title="Chi tiết sự cố"
      titleVariant="sectionTitle"
      variant="surface"
    />
  );

  if (incidentQuery.isPending) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        {header}
        <YStack padding="$4">
          <EmptyState
            description="Chi tiết sự cố đang được tải về từ hệ thống."
            title="Đang tải chi tiết sự cố"
          />
        </YStack>
      </Screen>
    );
  }

  if (incidentQuery.isError || !incident) {
    return (
      <Screen tone="subtle">
        <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />
        {header}
        <YStack padding="$4">
          <EmptyState
            description={incidentQuery.isError
              ? presentIncidentError(incidentQuery.error)
              : "Không tìm thấy chi tiết sự cố này."}
            title="Không thể tải chi tiết sự cố"
          />
        </YStack>
      </Screen>
    );
  }

  const assignmentEta = formatIncidentDuration(incident.assignments?.durationSeconds ?? null);
  const assignmentDistance = formatIncidentDistance(incident.assignments?.distanceMeters ?? null);
  const assignmentRoute = assignmentDistance || assignmentEta
    ? [assignmentDistance ? `Khoảng cách ${assignmentDistance}` : null, assignmentEta ? `ETA ${assignmentEta}` : null]
        .filter(Boolean)
        .join(", ")
    : null;
  const coordinates = formatCoordinates(incident.latitude, incident.longitude);
  const {
    actionKind,
    handleAccept,
    handleReject,
    handleResolve,
    handleStart,
    isAccepting,
    isRejecting,
    isResolving,
    isStarting,
  } = useTechnicianIncidentActions({
    assignmentStatus: incident.assignments?.status ?? null,
    incidentId: incident.id,
    onRejected: () => navigation.goBack(),
  });

  const needsFooterSpacer = Boolean(actionKind)
    && contentHeight + footerHeight > viewportHeight;
  const bottomContentPadding = actionKind
    ? needsFooterSpacer
      ? footerHeight + spaceScale[3]
      : spaceScale[4]
    : spaceScale[7];

  return (
    <Screen tone="subtle">
      <StatusBar backgroundColor={theme.surfaceDefault.val} barStyle="dark-content" />

      {header}

      <ScrollView
        onLayout={(event) => {
          setViewportHeight(event.nativeEvent.layout.height);
        }}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomContentPadding }}
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
        <YStack
          gap="$4"
          onLayout={(event) => {
            setContentHeight(event.nativeEvent.layout.height);
          }}
          padding="$4"
        >
          <AppCard borderRadius="$4" chrome="whisper" gap="$3" padding="$4">
            <XStack flexWrap="wrap" gap="$2">
              <StatusBadge label={getIncidentStatusLabel(incident.status)} tone={getIncidentStatusTone(incident.status)} />
              <StatusBadge label={getIncidentSeverityLabel(incident.severity)} tone={getIncidentSeverityTone(incident.severity)} />
              <StatusBadge label={getIncidentSourceLabel(incident.source)} tone="neutral" withDot={false} />
            </XStack>

            <YStack gap="$2">
              <AppText variant="sectionTitle">{incident.incidentType}</AppText>
              {incident.description
                ? <AppText variant="bodySmall">{incident.description}</AppText>
                : <AppText tone="muted" variant="bodySmall">Chưa có mô tả chi tiết từ người báo sự cố.</AppText>}
            </YStack>
          </AppCard>

          <YStack gap="$3">
            <SectionLabel>Người báo và chuyến thuê</SectionLabel>
            <AppCard borderRadius="$4" chrome="whisper" gap="$3" padding="$4">
              <DetailLine label="Người báo" value={incident.reporterUser.fullName} />
              <DetailLine label="Số điện thoại" value={incident.reporterUser.phoneNumber} />
              <DetailLine label="Mã chuyến thuê" value={incident.rental?.id ?? null} />
              <DetailLine label="Trạng thái chuyến thuê" value={incident.rental?.status ?? null} />
            </AppCard>
          </YStack>

          <YStack gap="$3">
            <SectionLabel>Thông tin xe và vị trí</SectionLabel>
            <AppCard borderRadius="$4" chrome="whisper" gap="$3" padding="$4">
              <DetailLine label="Mã xe" value={incident.bike.chipId} />
              <DetailLine label="Trạm liên quan" value={incident.station?.name ?? null} />
              <DetailLine label="Địa chỉ trạm" value={incident.station?.address ?? null} />
              <DetailLine label="Tọa độ" value={coordinates} />
              <DetailLine label="Bánh xe đang khóa" value={incident.bikeLocked ? "Có" : "Không"} />
            </AppCard>
          </YStack>

          <YStack gap="$3">
            <SectionLabel>Điều phối kỹ thuật viên</SectionLabel>
            <AppCard borderRadius="$4" chrome="whisper" gap="$3" padding="$4">
              <DetailLine label="Kỹ thuật viên" value={incident.assignments?.technician?.fullName ?? null} />
              <DetailLine label="Nhóm kỹ thuật" value={incident.assignments?.team?.name ?? null} />
              <DetailLine label="Lộ trình" value={assignmentRoute} />
              <DetailLine label="Được phân công lúc" value={formatDateTime(incident.assignments?.assignedAt ?? null)} />
            </AppCard>
          </YStack>

          <YStack gap="$3">
            <SectionLabel>Mốc thời gian</SectionLabel>
            <AppCard borderRadius="$4" chrome="whisper" gap="$3" padding="$4">
              <DetailLine label="Báo lúc" value={formatDateTime(incident.reportedAt)} />
              <DetailLine label="Xử lý xong lúc" value={formatDateTime(incident.resolvedAt)} />
              <DetailLine label="Đóng lúc" value={formatDateTime(incident.closedAt)} />
            </AppCard>
          </YStack>
        </YStack>
      </ScrollView>

      <TechnicianIncidentActionBar
        actionKind={actionKind}
        isAccepting={isAccepting}
        isRejecting={isRejecting}
        isResolving={isResolving}
        isStarting={isStarting}
        onAccept={handleAccept}
        onLayout={setFooterHeight}
        onReject={handleReject}
        onResolve={handleResolve}
        onStart={handleStart}
      />
    </Screen>
  );
}
