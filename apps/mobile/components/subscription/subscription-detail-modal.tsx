import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useGetSubscriptionDetailQuery } from "@hooks/query/Subscription/useGetSubscriptionDetailQuery";

import { formatCurrency, formatDate, getStatusStyle } from "@utils/subscription";

type Props = {
  visible: boolean;
  subscriptionId?: string;
  onClose: () => void;
};

export function SubscriptionDetailModal({ visible, subscriptionId, onClose }: Props) {
  const { data, isLoading } = useGetSubscriptionDetailQuery(subscriptionId ?? "", visible);
  const statusStyles = data ? getStatusStyle(data.subscription.status) : undefined;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          {isLoading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          )}

          {!isLoading && data && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>{data.subscription.package_name.toUpperCase()}</Text>
                {statusStyles && (
                  <View style={[styles.statusBadge, { backgroundColor: statusStyles.background }]}> 
                    <Text style={[styles.statusText, { color: statusStyles.text }]}>{data.subscription.status}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.price}>{formatCurrency(data.subscription.price)}</Text>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin gói</Text>
                <InfoRow label="Ngày đăng ký" value={formatDate(data.subscription.created_at)} />
                <InfoRow label="Ngày kích hoạt" value={formatDate(data.subscription.activated_at)} />
                <InfoRow label="Ngày hết hạn" value={formatDate(data.subscription.expires_at)} />
                <InfoRow
                  label="Lượt đã dùng"
                  value={`${data.subscription.usage_count}/${data.subscription.max_usages ?? "∞"}`}
                />
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Người dùng</Text>
                <InfoRow label="Họ tên" value={data.user.fullname} />
                <InfoRow label="Email" value={data.user.email} />
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type InfoRowProps = {
  label: string;
  value?: string | number | null;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
  },
  loader: {
    paddingVertical: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  price: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: {
    color: "#6B7280",
  },
  infoValue: {
    color: "#111827",
    fontWeight: "600",
  },
});
