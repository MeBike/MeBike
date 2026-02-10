import type { UserDetail } from "@services/users/user-service";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
    paddingBottom: 38,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 8,
    alignItems: "center",
    elevation: 8,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 16,
    zIndex: 12,
    borderRadius: 30,
    padding: 6,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#e0eaff",
    marginBottom: 18,
    fontWeight: "500",
  },
  verificationBadge: {
    position: "absolute",
    bottom: 10,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 2,
  },
});

type ProfileHeaderProps = {
  profile: UserDetail;
  completedTrips: number;
  isLoadingTrips: boolean;
  topInset: number;
  canGoBack: boolean;
  onBack: () => void;
  formatDate: (dateString: string) => string;
};

function ProfileHeader({
  profile,
  completedTrips,
  isLoadingTrips,
  topInset,
  canGoBack,
  onBack,
  formatDate,
}: ProfileHeaderProps) {
  return (
    <LinearGradient
      colors={["#0066FF", "#00B4D8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        ...styles.header,
        paddingTop: topInset + 32,
      }}
    >
      {canGoBack && (
        <TouchableOpacity
          style={[styles.backButton, { top: topInset + 10 }]}
          onPress={onBack}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
      )}
      <View style={styles.headerContent}>
        <View>
          <Image
            source={
              profile.avatar
                ? { uri: profile.avatar }
                : require("../../../assets/avatar2.png")
            }
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderWidth: 4,
              borderColor: "#fff",
              marginBottom: 14,
              backgroundColor: "#EBF3FB",
              shadowColor: "#000",
              shadowOpacity: 0.14,
              shadowRadius: 10,
            }}
          />
          {profile.verify === "VERIFIED" && (
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            </View>
          )}
        </View>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {profile.fullname}
        </Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>
          Thành viên từ
          {" "}
          {formatDate(profile.updatedAt)}
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 36,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#fff" }}>
              {isLoadingTrips ? "—" : completedTrips}
            </Text>
            <Text style={{ fontSize: 13, color: "#e0eaff", marginTop: 2 }}>
              Chuyến đi
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

export default ProfileHeader;
