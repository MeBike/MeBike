import React from "react";
import {
  Alert,
  Image,
  Modal,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "./styles";

type QRModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
};

export function QRModal({ visible, onClose, userId }: QRModalProps) {
  const handleShareUserId = async () => {
    try {
      await Share.share({
        message: `user_id của tôi: ${userId}`,
      });
    }
    catch {
      Alert.alert("Lỗi", "Không thể chia sẻ user_id");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Quét mã QR để nạp tiền</Text>
          <Image
            source={require("../../../assets/qr.png")}
            style={styles.qrImage}
            resizeMode="contain"
          />
          <Text style={styles.instruction}>
            VUI LÒNG COPY ID VÀO TIN NHẮN CHUYỂN KHOẢN
          </Text>
          <Text selectable style={styles.userId}>
            {`Mã giao dịch: ${userId}`}
          </Text>

          <TouchableOpacity style={styles.shareButton} onPress={handleShareUserId}>
            <Text style={styles.shareText}>Copy mã</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
