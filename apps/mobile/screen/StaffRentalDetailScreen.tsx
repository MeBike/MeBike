import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import BookingDetailHeader from "./booking-history-detail/components/BookingDetailHeader";
import StatusCard from "./booking-history-detail/components/StatusCard";
import BikeInfoCard from "./booking-history-detail/components/BikeInfoCard";
import TimeInfoCard from "./booking-history-detail/components/TimeInfoCard";
import PaymentInfoCard from "./booking-history-detail/components/PaymentInfoCard";
import BookingIdCard from "./booking-history-detail/components/BookingIdCard";
import UserInfoCard from "./booking-history-detail/components/UserInfoCard";
import LoadingState from "./booking-history-detail/components/LoadingState";
import ErrorState from "./booking-history-detail/components/ErrorState";

import StaffEndRentalCard from "./booking-history-detail/components/StaffEndRentalCard";
import { useStationActions } from "@hooks/useStationAction";
import usePutStaffEndRental from "@hooks/mutations/Rentals/usePutStaffEndRental";
import { useStaffGetDetailRentalQuery } from "@hooks/query/Rent/useStaffGetDetailRentalQuery";
import type { RentalDetail } from "../types/RentalTypes";
import type { StationType } from "../types/StationType";

type RouteParams = {
  rentalId: string;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});

function StaffRentalDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { rentalId } = route.params as RouteParams;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    stations: stationData,
    isLoadingGetAllStations,
    refetch: refetchStations,
  } = useStationActions(true);
  const [stations, setStations] = useState<StationType[]>(stationData || []);

  const {
    data: rentalDetailData,
    isLoading: isRentalLoading,
    isError: isRentalError,
    refetch: refetchRental,
  } = useStaffGetDetailRentalQuery(rentalId, true);

  const endRentalMutation = usePutStaffEndRental();

  useEffect(() => {
    setStations(stationData || []);
  }, [stationData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchRental(), refetchStations()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchRental, refetchStations]);

  const booking = useMemo(() => {
    return rentalDetailData?.data?.result as RentalDetail | undefined;
  }, [rentalDetailData?.data?.result]);

  const handleStaffEndRental = useCallback(
    ({ end_station, reason }: { end_station: string; reason: string }) => {
      endRentalMutation.mutate(
        { id: rentalId, end_station, reason },
        {
          onSuccess: () => {
            Alert.alert("Thành công", "Đã kết thúc phiên thuê cho khách.");
            refetchRental();
          },
          onError: (error: any) => {
            const message =
              error?.response?.data?.message ||
              "Không thể kết thúc phiên thuê. Vui lòng thử lại.";
            Alert.alert("Thất bại", message);
          },
        },
      );
    },
    [endRentalMutation, rentalId, refetchRental],
  );

  const isInitialLoading = isRentalLoading || isLoadingGetAllStations;

  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <BookingDetailHeader
          title="Quản lý phiên thuê"
          onBackPress={() => navigation.goBack()}
        />
        <LoadingState />
      </View>
    );
  }

  if (isRentalError || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <BookingDetailHeader
          title="Quản lý phiên thuê"
          onBackPress={() => navigation.goBack()}
        />
        <ErrorState onRetry={refetchRental} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <BookingDetailHeader
          title="Quản lý phiên thuê"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StatusCard status={booking.status} />
          <BikeInfoCard booking={booking} />
          <TimeInfoCard booking={booking} />
          <PaymentInfoCard booking={booking} />
          <BookingIdCard booking={booking} />
          <UserInfoCard booking={booking} />

          {booking.status === "ĐANG THUÊ" && (
            <StaffEndRentalCard
              booking={booking}
              stations={stations}
              isSubmitting={endRentalMutation.isPending}
              onSubmit={handleStaffEndRental}
            />
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

export default StaffRentalDetailScreen;
