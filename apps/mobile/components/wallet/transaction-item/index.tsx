import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import {
  formatCurrency,
  formatDate,
  formatTransactionStatus,
  formatTransactionType,
  getTransactionColor,
  getTransactionIcon,
} from "../../../utils/wallet/formatters";
import { styles } from "./styles";

export type TransactionType = "transaction" | "withdrawal" | "refund";

type BaseItem = {
  id: string;
  amount: string | number;
  createdAt: string;
  status: string;
};

type TransactionItemProps = {
  type: TransactionType;
  item: BaseItem & {
    description?: string;
    type?: string;
  };
  onPress?: () => void;
};

export function TransactionItem({ type, item, onPress }: TransactionItemProps) {
  const rawStatus = (item.status || "").toUpperCase();

  const getIcon = () => {
    if (type === "withdrawal")
      return "arrow-up-circle";
    if (type === "refund")
      return "swap-horizontal";
    return getTransactionIcon(item.type || "");
  };

  const getColor = () => {
    if (type === "withdrawal")
      return "#F59E0B";
    if (type === "refund")
      return "#10B981";
    return getTransactionColor(item.type || "");
  };

  const getDescription = () => {
    const txType = (item.type || "").toUpperCase();
    switch (txType) {
      case "DEPOSIT":
        return "Nạp tiền";
      case "DEBIT":
        return "Thanh toán";
      case "REFUND":
        return "Hoàn tiền";
      case "ADJUSTMENT":
        return "Điều chỉnh";
      default:
        return formatTransactionType(item.type || "") || "Giao dịch ví";
    }
  };

  const getAmount = () => {
    const isMoneyOut = item.type === "DEBIT";
    const prefix = isMoneyOut ? "-" : "+";
    return `${prefix}${formatCurrency(item.amount)}`;
  };

  const IconComponent = (
    <View style={[styles.icon, { backgroundColor: `${getColor()}20` }]}>
      <Ionicons name={getIcon() as any} size={20} color={getColor()} />
    </View>
  );

  const Content = (
    <View style={styles.container}>
      <View style={styles.left}>
        {IconComponent}
        <View style={styles.info}>
          <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
            {getDescription()}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            {rawStatus !== "SUCCESS" && (
              <>
                <Text style={styles.metaDivider}>•</Text>
                <Text
                  style={[
                    styles.statusText,
                    rawStatus === "FAILED"
                      ? styles.statusTextFailed
                      : rawStatus === "PENDING"
                        ? styles.statusTextPending
                        : null,
                  ]}
                >
                  {formatTransactionStatus(item.status)}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: getColor() }]}>{getAmount()}</Text>
        <Text style={styles.hint}>{formatTransactionType(item.type || "")}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.item}>
      {Content}
    </View>
  );
}
