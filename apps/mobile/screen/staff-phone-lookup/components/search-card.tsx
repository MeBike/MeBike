import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "../styles";

export function SearchCard({
  phoneNumber,
  onPhoneChange,
  onLookup,
  isPending,
  isDisabled,
  summary,
}: {
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  onLookup: () => void;
  isPending: boolean;
  isDisabled: boolean;
  summary: string | null;
}) {
  return (
    <View style={styles.lookupCard}>
      <Text style={styles.lookupTitle}>Tìm kiếm khách hàng</Text>
      <Text style={styles.lookupDescription}>
        Nhập số điện thoại khách hàng để lấy danh sách phiên thuê đang hoạt động
        trong trường hợp họ không thể quét mã QR.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: 0912345678"
        placeholderTextColor="#9CA3AF"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={onPhoneChange}
        maxLength={15}
      />
      <TouchableOpacity
        style={[styles.lookupButton, isDisabled && styles.lookupButtonDisabled]}
        disabled={isDisabled}
        onPress={onLookup}
      >
        {isPending
          ? <ActivityIndicator color="#fff" />
          : (
              <>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.lookupButtonText}>Tra cứu</Text>
              </>
            )}
      </TouchableOpacity>
      {summary && <Text style={styles.lookupSummary}>{summary}</Text>}
    </View>
  );
}
