import { useNavigation, useRoute } from "@react-navigation/native";
import { borderWidths, spaceScale } from "@theme/metrics";
import React, { useState } from "react";
import { Linking, RefreshControl, ScrollView, StatusBar } from "react-native";
import { useTheme, XStack, YStack } from "tamagui";

import type {
  TechnicianIncidentDetailNavigationProp,
  TechnicianIncidentDetailRouteProp,
} from "@/types/navigation";

import { IconSymbol } from "@/components/IconSymbol";
import { useIncidentDetailQuery } from "@/screen/incidents/hooks/use-incident-detail-query";
import { formatIncidentCode, formatIncidentDateTime } from "@/screen/incidents/incident-formatters";
import {
  formatIncidentDistance,
  formatIncidentDuration,
  getIncidentSeverityLabel,
  getIncidentSeverityTone,
  getIncidentSourceLabel,
  getIncidentStatusLabel,
  getIncidentStatusTone,
  presentIncidentError,
} from "@/screen/incidents/incident-presenters";
import { AppHeroHeader } from "@/ui/patterns/app-hero-header";
import { AppCard } from "@/ui/primitives/app-card";
import { AppIconActionButton } from "@/ui/primitives/app-icon-action-button";
import { AppText } from "@/ui/primitives/app-text";
import { Screen } from "@/ui/primitives/screen";
import { StatusBadge } from "@/ui/primitives/status-badge";

import { TechnicianIncidentActionBar } from "./components/technician-incident-action-bar";
import { useTechnicianIncidentActions } from "./hooks/use-technician-incident-actions";

function formatCoordinates(latitude: number | null, longitude: number | null) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function formatIncidentTitle(incidentType: string) {
  if (incidentType === "GENERAL_REPORT") {
    return "Báo cáo chung";
  }

  return incidentType.replaceAll("_", " ");
}

function getIncidentHeadline(incidentType: string) {
  return formatIncidentTitle(incidentType);
}

function SectionCard({
  accentTone = "accent",
  children,
  icon,
  title,
}: {
  accentTone?: "accent" | "danger" | "success" | "warning";
  children: React.ReactNode;
  icon: "bike" | "person" | "tools" | "clock";
  title: string;
}) {
  const toneStyles = {
    accent: { backgroundColor: "$surfaceAccent", iconColorKey: "textBrand" },
    danger: { backgroundColor: "$surfaceDanger", iconColorKey: "textDanger" },
    success: { backgroundColor: "$surfaceSuccess", iconColorKey: "textSuccess" },
    warning: { backgroundColor: "$surfaceWarning", iconColorKey: "textWarning" },
  } as const;
  const theme = useTheme();
  const toneStyle = toneStyles[accentTone];
  const iconColor = theme[toneStyle.iconColorKey].val;

  return (
    <AppCard borderColor="$borderSubtle" borderRadius="$6" borderWidth={borderWidths.subtle} chrome="flat" gap="$0" overflow="hidden" padding="$0">
      <XStack
        alignItems="center"
        backgroundColor="$surfaceDefault"
        borderBottomColor="$borderSubtle"
        borderBottomWidth={borderWidths.subtle}
        gap="$3"
        paddingHorizontal="$5"
        paddingVertical="$3"
      >
        <XStack
          alignItems="center"
          backgroundColor={toneStyle.backgroundColor}
          borderRadius="$4"
          height={40}
          justifyContent="center"
          width={40}
        >
          <IconSymbol color={iconColor} name={icon} size="sm" />
        </XStack>
        <AppText variant="label">{title}</AppText>
      </XStack>

      <YStack paddingVertical="$1">
        {children}
      </YStack>
    </AppCard>
  );
}

function DetailRow({
  action,
  emptyLabel = "Chưa có",
  isLast = false,
  label,
  value,
  valueTone = "default",
}: {
  action?: React.ReactNode;
  emptyLabel?: string;
  isLast?: boolean;
  label: string;
  value: React.ReactNode;
  valueTone?: "default" | "brand" | "danger" | "warning" | "success";
}) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <YStack>
      <XStack
        alignItems="center"
        gap="$3"
        justifyContent="space-between"
        paddingHorizontal="$5"
        paddingVertical="$4"
      >
        <AppText tone="muted" variant="bodySmall">
          {label}
        </AppText>
        <XStack alignItems="center" gap="$3" maxWidth="60%">
          {hasValue
            ? (
                <AppText align="right" flexShrink={1} tone={valueTone} variant="compactStrong">
                  {value}
                </AppText>
              )
            : (
                <AppText align="right" flexShrink={1} tone="subtle" variant="bodySmall">
                  {emptyLabel}
                </AppText>
              )}
          {action ?? null}
        </XStack>
      </XStack>

      {!isLast
        ? (
            <XStack
              alignSelf="stretch"
              backgroundColor="$backgroundSubtle"
              height={borderWidths.subtle}
            />
          )
        : null}
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
    assignmentStatus: incident?.assignments?.status ?? null,
    incidentId,
    onRejected: () => navigation.goBack(),
  });

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
  const handleCallReporter = () => {
    if (incident.reporterUser.phoneNumber) {
      void Linking.openURL(`tel:${incident.reporterUser.phoneNumber}`);
    }
  };
  const handleOpenMap = () => {
    if (coordinates) {
      void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${incident.latitude},${incident.longitude}`);
    }
  };

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
          gap="$5"
          onLayout={(event) => {
            setContentHeight(event.nativeEvent.layout.height);
          }}
          padding="$4"
          paddingTop="$5"
        >
          <AppCard borderRadius="$6" borderWidth={0} chrome="flat" gap="$4" padding="$5">
            <XStack flexWrap="wrap" gap="$2">
              <StatusBadge label={getIncidentStatusLabel(incident.status).toUpperCase()} pulseDot={incident.status !== "RESOLVED" && incident.status !== "CLOSED" && incident.status !== "CANCELLED"} tone={getIncidentStatusTone(incident.status)} />
              <StatusBadge label={getIncidentSeverityLabel(incident.severity)} tone={getIncidentSeverityTone(incident.severity)} withDot={false} />
              <StatusBadge label={getIncidentSourceLabel(incident.source)} tone="neutral" withDot={false} />
            </XStack>

            <YStack gap="$3">
              <AppText variant="sectionTitle">{getIncidentHeadline(incident.incidentType)}</AppText>
              {incident.description
                ? (
                    <AppCard borderRadius="$5" chrome="flat" tone="muted" padding="$4">
                      <AppText tone="muted" variant="bodySmall">
                        {incident.description}
                      </AppText>
                    </AppCard>
                  )
                : <AppText tone="muted" variant="bodySmall">Chưa có mô tả chi tiết từ người báo sự cố.</AppText>}
            </YStack>
          </AppCard>

          <SectionCard icon="person" title="Người báo & Chuyến thuê">
            <DetailRow label="Người báo" value={incident.reporterUser.fullName} />
            <DetailRow
              action={<AppIconActionButton icon="phone" onPress={handleCallReporter} tone="accent" />}
              label="Số điện thoại"
              value={incident.reporterUser.phoneNumber}
            />
            <DetailRow emptyLabel="Chưa có mã chuyến" label="Mã chuyến thuê" value={incident.rental?.id ? `${incident.rental.id.slice(0, 10)}...` : ""} />
            <DetailRow emptyLabel="Chưa có trạng thái" isLast label="Trạng thái chuyến" value={incident.rental?.status ?? ""} valueTone="warning" />
          </SectionCard>

          <SectionCard accentTone="success" icon="bike" title="Thông tin xe & Vị trí">
            <DetailRow label="Mã xe" value={incident.bike.chipId} />
            <DetailRow label="Khóa xe đang bật" value={incident.bikeLocked ? "Có" : "Không"} valueTone={incident.bikeLocked ? "danger" : "success"} />
            <DetailRow emptyLabel="Không gắn với trạm" label="Trạm liên quan" value={incident.station?.name ?? ""} />
            <DetailRow
              action={coordinates
                ? <AppIconActionButton icon="location" onPress={handleOpenMap} tone="neutral" />
                : undefined}
              emptyLabel="Chưa có tọa độ"
              label="Tọa độ"
              value={coordinates}
              isLast
            />
          </SectionCard>

          <SectionCard icon="tools" title="Thông tin kỹ thuật viên ">
            <DetailRow emptyLabel="Chưa điều phối" label="Kỹ thuật viên" value={incident.assignments?.technician?.fullName ?? ""} />
            <DetailRow emptyLabel="Chưa có nhóm" label="Nhóm kỹ thuật" value={incident.assignments?.team?.name ?? ""} />
            <DetailRow emptyLabel="Chưa có ETA" label="Lộ trình" value={assignmentRoute} valueTone="brand" />
            <DetailRow emptyLabel="Chưa phân công" isLast label="Phân công lúc" value={formatIncidentDateTime(incident.assignments?.assignedAt ?? null)} />
          </SectionCard>

          <SectionCard accentTone="warning" icon="clock" title="Mốc thời gian">
            <DetailRow label="Báo lúc" value={formatIncidentDateTime(incident.reportedAt)} />
            <DetailRow emptyLabel="Chưa hoàn tất" label="Xử lý xong lúc" value={formatIncidentDateTime(incident.resolvedAt)} />
            <DetailRow emptyLabel="Chưa đóng" isLast label="Đóng lúc" value={formatIncidentDateTime(incident.closedAt)} />
          </SectionCard>
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
