import { IconSymbol } from "@components/IconSymbol";
import { BikeColors } from "@constants/BikeColors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  header: {
    paddingTop: 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  rightSlot: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    marginTop: 18,
    alignItems: "center",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  cameraButton: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BikeColors.accent,
    borderWidth: 2,
    borderColor: "white",
  },
});

type UpdateProfileHeaderProps = {
  onBack: () => void;
  onPrimaryAction: () => void;
  isEditing: boolean;
  isBusy: boolean;
  avatarUrl: string;
  onPickAvatar: () => void;
  isUploadingAvatar: boolean;
};

export function UpdateProfileHeader({
  onBack,
  onPrimaryAction,
  isEditing,
  isBusy,
  avatarUrl,
  onPickAvatar,
  isUploadingAvatar,
}: UpdateProfileHeaderProps) {
  return (
    <LinearGradient colors={[BikeColors.primary, BikeColors.secondary]} style={styles.header}>
      <View style={styles.headerTop}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <IconSymbol name="arrow.left" size={24} color="white" />
        </Pressable>
        <Text style={styles.title}>Hồ sơ</Text>
        <Pressable style={styles.rightSlot} onPress={onPrimaryAction} disabled={isBusy}>
          <Ionicons
            name={isEditing ? "checkmark" : "pencil"}
            size={20}
            color={isBusy ? "rgba(255,255,255,0.7)" : "white"}
          />
        </Pressable>
      </View>

      <View style={styles.avatarWrap}>
        <View>
          <Image
            source={{ uri: avatarUrl || "https://via.placeholder.com/100" }}
            style={styles.avatar}
          />

          {isEditing
            ? (
                <Pressable
                  style={styles.cameraButton}
                  onPress={onPickAvatar}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar
                    ? <ActivityIndicator size="small" color="white" />
                    : <Ionicons name="camera" size={18} color="white" />}
                </Pressable>
              )
            : null}
        </View>
      </View>
    </LinearGradient>
  );
}
