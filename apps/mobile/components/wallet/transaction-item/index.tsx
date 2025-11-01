import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import {
  formatCurrency,
  formatDate,
  getTransactionColor,
  getTransactionIcon,
  truncateId,
} from "../../../utils/wallet/formatters";
import { styles } from "./styles";

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
};

export function TransactionItem({ type, item, onPress }: TransactionItemProps) {
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
      return `Rút tiền về ${(item as any).bank}`;
    }
    if (type === "refund") {
      return `Hoàn tiền cho giao dịch ${truncateId((item as any).transaction_id)}`;
    }
    const description = (item as any).description;
    if (description && typeof description === "string") {
      //  1: "bike_id:" or "bike id:" or "bikeid:"
      let bikeIdMatch = description.match(/bike[_\s]?id[:\s]*([a-f0-9]{24})/i);
      if (bikeIdMatch) {
        const bikeId = bikeIdMatch[1];
        return description.replace(bikeId, truncateId(bikeId));
      }

      //  2: end of description (e.g., "cho xe 671f3c2e8a4b5c6d7e8f9a0b") // format kieu khac la bay tieu
      bikeIdMatch = description.match(/([a-f0-9]{24})$/i);
      if (bikeIdMatch) {
        const bikeId = bikeIdMatch[1];
        return description.replace(bikeId, truncateId(bikeId));
      }

      bikeIdMatch = description.match(/([a-f0-9]{24})/i);
      if (bikeIdMatch) {
        const bikeId = bikeIdMatch[1];
        return description.replace(bikeId, truncateId(bikeId));
      }
    }
    return description;
  };

  const getAmount = () => {
    // Money OUT (negative) for: withdrawals, payments, bookings, top-ups
    // Money IN (positive) for: refunds
    const isMoneyOut
      = type === "withdrawal"
        || item.type === "RÚT TIỀN"
        || item.type === "THANH TOÁN"
        || item.type === "ĐẶT TRUỚC";

    const prefix = isMoneyOut ? "-" : "+";
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
            {formatDate(item.created_at)}
            {" "}
            •
            {" "}
            <Text style={{ fontWeight: "bold" }}>{item.status}</Text>
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: getColor() }]}>{getAmount()}</Text>
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
