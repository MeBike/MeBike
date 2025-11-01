import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { transactionItemStyles as styles } from "../../styles/wallet/transactionItem";
import { formatCurrency, getTransactionColor, getTransactionIcon } from "../../utils/wallet/formatters";

export type TransactionType = "transaction" | "withdrawal" | "refund";

type BaseItem = {
  _id: string;
  amount: number;
  created_at: string;
  status: string;
};

type TransactionItemProps = {
  type: TransactionType;
  item: BaseItem & {
    description?: string;
    type?: string;
    bank_name?: string;
    transaction_id?: string;
  };
  onPress?: () => void;
  showRefundHint?: boolean;
};

export function TransactionItem({ type, item, onPress, showRefundHint = false }: TransactionItemProps) {
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
      return "#8B5CF6";
    return getTransactionColor(item.type || "");
  };

  const getDescription = () => {
    if (type === "withdrawal") {
      return `Rút tiền về ${(item as any).bank_name}`;
    }
    if (type === "refund") {
      return `Hoàn tiền cho giao dịch ${(item as any).transaction_id}`;
    }
    return (item as any).description;
  };

  const getAmount = () => {
    const prefix = type === "withdrawal" || (type === "transaction" && (item.type === "RÚT TIỀN" || item.type === "rút")) ? "-" : "+";
    return `${prefix}${formatCurrency(item.amount.toString())}`;
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
          <Text style={styles.description}>{getDescription()}</Text>
          <Text style={styles.date}>
            {item.created_at}
            {" "}
            •
            {" "}
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: getColor() }]}>{getAmount()}</Text>
        {showRefundHint && (
          <Text style={styles.hint}>Nhấn để hoàn tiền</Text>
        )}
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
