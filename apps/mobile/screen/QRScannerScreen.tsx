import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Đang tải quyền truy cập camera...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.message}>
            Chúng tôi cần quyền truy cập camera để quét mã QR.
          </Text>
          <Button onPress={requestPermission} title="Cấp quyền truy cập" />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.settingsButtonText}>Mở cài đặt ứng dụng</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanned) {
      setScanned(true);
      Alert.alert(
        "Mã QR đã quét",
        `Loại: ${type}\nDữ liệu: ${data}`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate('Main');
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.topOverlay}>
          <Text style={styles.promptText}>Đặt mã QR vào khung để quét</Text>
        </View>
        <View style={styles.middleContainer}>
          <View style={styles.sideOverlay} />
          <View style={styles.focusedContainer} />
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay} />
      </View>

      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 10 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="close-circle" size={36} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 10,
    backgroundColor: "black",
  },
  message: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "white",
  },
  cancelButton: {
    marginTop: 20,
    padding: 10,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
  },
  settingsButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#0066FF',
    borderRadius: 5,
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 16,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  middleContainer: {
    flexDirection: "row",
    flex: 1.5,
  },
  focusedContainer: {
    flex: 6,
    borderColor: "white",
    borderWidth: 2,
    borderRadius: 10,
  },
  promptText: {
    paddingBottom: 20,
    textAlign: "center",
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    left: 20,
    zIndex: 1,
  },
});

export default QRScannerScreen;
