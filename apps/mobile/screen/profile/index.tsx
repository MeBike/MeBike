import { VerifyEmailModal } from "@components/verify-email-modal";
import { useNavigation } from "@react-navigation/native";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProfileActions from "./components/profile-actions";
import ProfileEmailVerification from "./components/profile-email-verification";
import ProfileHeader from "./components/profile-header";
import ProfileInfoCard from "./components/profile-info-card";
import ProfileMenuOption from "./components/profile-menu-option";
import { useProfile } from "./hooks/use-profile";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
});

function ProfileScreen() {
  const navigation = useNavigation();
  const {
    profile,
    isVerifyEmailModalOpen,
    openVerifyModal,
    closeVerifyModal,
    isResendingOtp,
    isVerifyingOtp,
    isRefreshing,
    onRefresh,
    isCustomer,
    isRentalCountsLoading,
    completedTrips,
    formatDate,
    handleLogout,
    handleChangePassword,
    handleUpdateProfile,
    handleSupport,
    handleReservations,
    handleSOS,
    handleSubscriptions,
    handleResendOtp,
    handleVerifyEmail,
    goBack,
  } = useProfile();

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <ProfileHeader
          profile={profile}
          completedTrips={completedTrips}
          isLoadingTrips={isRentalCountsLoading}
          topInset={insets.top}
          canGoBack={navigation.canGoBack()}
          onBack={goBack}
          formatDate={formatDate}
        />

        <View style={styles.content}>
          <ProfileInfoCard profile={profile} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dịch vụ của tôi</Text>
            <ProfileMenuOption
              icon="help-circle"
              title="Báo cáo sự cố xe đạp"
              subtitle="Liên hệ với đội hỗ trợ"
              onPress={handleSupport}
            />
            {isCustomer && (
              <>
                <ProfileMenuOption
                  icon="ribbon"
                  title="Gói tháng"
                  subtitle="Ưu đãi và lịch sử gói"
                  onPress={handleSubscriptions}
                />
                <ProfileMenuOption
                  icon="calendar"
                  title="Đặt trước của tôi"
                  subtitle="Theo dõi các lượt đặt trước"
                  onPress={handleReservations}
                />
                <ProfileMenuOption
                  icon="medical"
                  title="Yêu cầu cứu hộ của tôi"
                  subtitle="Theo dõi các yêu cầu cứu hộ"
                  onPress={handleSOS}
                />
              </>
            )}
          </View>

          {profile.verify !== "VERIFIED" && (
            <ProfileEmailVerification
              profile={profile}
              isResendingOtp={isResendingOtp}
              onVerify={openVerifyModal}
              onResend={handleResendOtp}
            />
          )}

          <ProfileActions
            onUpdateProfile={handleUpdateProfile}
            onChangePassword={handleChangePassword}
            onLogout={handleLogout}
          />
        </View>
      </ScrollView>

      <VerifyEmailModal
        visible={isVerifyEmailModalOpen}
        onClose={closeVerifyModal}
        onSubmit={handleVerifyEmail}
        isLoading={isVerifyingOtp}
      />
    </View>
  );
}

export default ProfileScreen;
