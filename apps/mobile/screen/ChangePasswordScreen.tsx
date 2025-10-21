import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BikeColors } from "../constants/BikeColors";
import { useAuth } from "@providers/auth-providers";
import { IconSymbol } from "../components/IconSymbol";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import type { ChangePasswordNavigationProp } from "../types/navigation";
import { Ionicons } from "@expo/vector-icons";
const ChangePasswordScreen = () => {
	const insets = useSafeAreaInsets();
  const navigation = useNavigation<ChangePasswordNavigationProp>();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { changePassword, isChangingPassword } = useAuth();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới và xác nhận không khớp");
      return;
    }
    changePassword(oldPassword, newPassword, confirmPassword);
    //     setTimeout(() => {
    //   navigation.navigate("Main");
    // }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[BikeColors.primary, BikeColors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 32, 
            paddingBottom: 38, 
            paddingHorizontal: 24,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            marginBottom: 8,
            alignItems: "center",
            elevation: 8,
            shadowColor: BikeColors.primary,
          }}
        >
          {/* Nút back nổi, căn vị trí xa nội dung */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: insets.top + 10,
              left: 16,
              zIndex: 12,
              borderRadius: 30,
              padding: 6,
            }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Text header căn giữa, spacing đều */}
          <View style={{ alignItems: "center", marginTop: 14 }}>
            <Text
              style={{
                fontSize: 24, // to hơn cho đều với profile
                color: "#fff",
                fontWeight: "700",
                marginBottom: 6,
                letterSpacing: 0.5,
              }}
            >
              Đổi mật khẩu
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: "#e0eaff",
                fontWeight: "500",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              Vui lòng nhập thông tin để đổi mật khẩu
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <IconSymbol
              name="lock"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu cũ"
              placeholderTextColor={BikeColors.textSecondary}
              secureTextEntry={!showOldPassword}
              value={oldPassword}
              onChangeText={setOldPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowOldPassword(!showOldPassword)}
              style={styles.eyeButton}
            >
              <IconSymbol
                name={showOldPassword ? "eye.slash" : "eye"}
                size={20}
                color={BikeColors.textSecondary}
              />
            </Pressable>
          </View>
          <View style={styles.inputContainer}>
            <IconSymbol
              name="lock"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu mới"
              placeholderTextColor={BikeColors.textSecondary}
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <IconSymbol
                name={showPassword ? "eye.slash" : "eye"}
                size={20}
                color={BikeColors.textSecondary}
              />
            </Pressable>
          </View>
          <View style={styles.inputContainer}>
            <IconSymbol
              name="lock"
              size={20}
              color={BikeColors.textSecondary}
            />
            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={BikeColors.textSecondary}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              <IconSymbol
                name={showConfirmPassword ? "eye.slash" : "eye"}
                size={20}
                color={BikeColors.textSecondary}
              />
            </Pressable>
          </View>
          <Pressable style={styles.button} onPress={handleChangePassword}>
            <Text style={styles.buttonText}>Xác nhận</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: BikeColors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BikeColors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: BikeColors.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },
  button: {
    backgroundColor: BikeColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default ChangePasswordScreen;
