import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { ScreenHeader } from "@components/ScreenHeader";
import { useWithdraw } from "../hooks/wallet/use-withdraw";
import { styles } from "./withdraw-screen-styles";
const VIETNAMESE_BANKS = [
  "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
  "Ngân hàng TMCP Công thương Việt Nam (VietinBank)",
  "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)",
  "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)",
  "Ngân hàng TMCP Á Châu (ACB)",
  "Ngân hàng TMCP Tiên Phong (TPBank)",
  "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)",
  "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
  "Ngân hàng TMCP Quân đội (MBBank)",
  "Ngân hàng TMCP Quốc tế (VIB)",
  "Ngân hàng TMCP Phát triển TP.HCM (HDBank)",
  "Ngân hàng TMCP Đông Á (DongABank)",
  "Ngân hàng TMCP Bắc Á (BacABank)",
  "Ngân hàng TMCP Việt Á (VietABank)",
  "Ngân hàng TMCP Nam Á (NamABank)",
  "Ngân hàng TMCP Đại Dương (OceanBank)",
  "Ngân hàng TMCP Kiên Long (KienLongBank)",
  "Ngân hàng TMCP Việt Nam Thương Tín (VietBank)",
  "Ngân hàng TMCP Xăng dầu Petrolimex (PG Bank)",
  "Ngân hàng TMCP Đại Chúng Việt Nam (PVcomBank)",
  "Ngân hàng TMCP Bưu điện Liên Việt (LienVietPostBank)",
  "Ngân hàng TMCP Phương Đông (OCB)",
  "Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)",
  "Ngân hàng TMCP Quốc Dân (NCB)",
  "Ngân hàng Hợp tác xã Việt Nam (Co-opBank)",
  "Ngân hàng TMCP An Bình (ABBank)",
  "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam (Eximbank)",
  "Ngân hàng TMCP Bảo Việt (BaoVietBank)",
  "Ngân hàng TMCP Đông Nam Á (SeABank)",
  "Ngân hàng TMCP Sài Gòn Công Thương (SaigonBank)",
];

function WithdrawScreen() {
  const navigation = useNavigation();
  const withdraw = useWithdraw();

  const [formData, setFormData] = useState({
    amount: "",
    bank: "",
    account: "",
    account_owner: "",
    note: "Rút tiền từ ví",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBankModal, setShowBankModal] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const amountWithoutFormat = formData.amount.replace(/\D/g, "");
    if (!amountWithoutFormat || Number(amountWithoutFormat) < 10000) {
      newErrors.amount = "Số tiền tối thiểu là 10,000 VND";
    }

    if (!formData.bank.trim()) {
      newErrors.bank = "Vui lòng nhập tên ngân hàng";
    }

    if (!formData.account.trim()) {
      newErrors.account = "Vui lòng nhập số tài khoản";
    }

    if (!formData.account_owner.trim()) {
      newErrors.account_owner = "Vui lòng nhập tên chủ tài khoản";
    }

    if (formData.note.length < 10 || formData.note.length > 500) {
      newErrors.note = "Ghi chú phải từ 10-500 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const amountWithoutFormat = formData.amount.replace(/\D/g, "");
      withdraw.createWithdrawal({
        amount: Number(amountWithoutFormat),
        bank: formData.bank,
        account: formData.account,
        account_owner: formData.account_owner,
        note: formData.note,
      });
    }
  };
  function formatNumberVND(value : string) {
    // Loại bỏ chữ cái và số 0 thừa đầu chuỗi
    let number = value.replace(/\D/g, "");
    // Trả về số dạng có dấu chấm: “3.000.000”
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />

      {/* Header */}
      <ScreenHeader
        title="Rút tiền"
        backIconName="arrow-back"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.description}>
            Vui lòng điền đầy đủ thông tin để thực hiện yêu cầu rút tiền
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số tiền (VND)</Text>
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              placeholder="Nhập số tiền"
              keyboardType="numeric"
              value={formatNumberVND(formData.amount)}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, amount: text }));
                if (errors.amount) {
                  setErrors((prev) => ({ ...prev, amount: "" }));
                }
              }}
            />
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tên ngân hàng</Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.selectInput,
                errors.bank && styles.inputError,
              ]}
              onPress={() => setShowBankModal(true)}
            >
              <Text
                style={[
                  styles.selectText,
                  !formData.bank && styles.placeholderText,
                ]}
              >
                {formData.bank || "Chọn ngân hàng"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
            {errors.bank && <Text style={styles.errorText}>{errors.bank}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Số tài khoản</Text>
            <TextInput
              style={[styles.input, errors.account && styles.inputError]}
              placeholder="Nhập số tài khoản"
              keyboardType="numeric"
              value={formData.account}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, account: text }));
                if (errors.account) {
                  setErrors((prev) => ({ ...prev, account: "" }));
                }
              }}
            />
            {errors.account && (
              <Text style={styles.errorText}>{errors.account}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Chủ tài khoản</Text>
            <TextInput
              style={[styles.input, errors.account_owner && styles.inputError]}
              placeholder="Nhập tên chủ tài khoản"
              value={formData.account_owner}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, account_owner: text }));
                if (errors.account_owner) {
                  setErrors((prev) => ({ ...prev, account_owner: "" }));
                }
              }}
            />
            {errors.account_owner && (
              <Text style={styles.errorText}>{errors.account_owner}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.note && styles.inputError,
              ]}
              placeholder="Nhập ghi chú (10-500 ký tự)"
              multiline
              numberOfLines={4}
              value={formData.note}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, note: text }));
                if (errors.note) {
                  setErrors((prev) => ({ ...prev, note: "" }));
                }
              }}
            />
            {errors.note && <Text style={styles.errorText}>{errors.note}</Text>}
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            withdraw.isCreatingWithdrawal && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={withdraw.isCreatingWithdrawal}
        >
          <Text style={styles.submitText}>
            {withdraw.isCreatingWithdrawal
              ? "Đang xử lý..."
              : "Xác nhận rút tiền"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bank Selection Modal */}
      <Modal
        visible={showBankModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ngân hàng</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowBankModal(false)}
              >
                <Ionicons name="close" size={24} color="#1a1a1a" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {VIETNAMESE_BANKS.map((bank, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.bankOption}
                  onPress={() => {
                    setFormData((prev) => ({ ...prev, bank }));
                    setShowBankModal(false);
                    if (errors.bank) {
                      setErrors((prev) => ({ ...prev, bank: "" }));
                    }
                  }}
                >
                  <Text style={styles.bankOptionText}>{bank}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

export default WithdrawScreen;