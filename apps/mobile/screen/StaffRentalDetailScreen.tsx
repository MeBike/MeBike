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
import LoadingState from "./booking-history-detail/components/LoadingState";
import ErrorState from "./booking-history-detail/components/ErrorState";
import StaffEndRentalCard from "./booking-history-detail/components/StaffEndRentalCard";
import { AdminBikeInfoCard } from "./booking-history-detail/v1/admin-bike-info-card";
import { AdminUserInfoCard } from "./booking-history-detail/v1/admin-user-info-card";
import { RentalBookingIdCard } from "./booking-history-detail/v1/booking-id-card";
import { RentalPaymentInfoCard } from "./booking-history-detail/v1/payment-info-card";
import { RentalStatusCard } from "./booking-history-detail/v1/status-card";
import { RentalTimeInfoCard } from "./booking-history-detail/v1/time-info-card";
import { useStationActions } from "@hooks/useStationAction";
import { useStaffEndRentalMutation } from "@hooks/mutations/rentals/use-staff-end-rental-mutation";
import { useStaffRentalDetailQuery } from "@hooks/query/rentals/use-staff-rental-detail-query";
import { rentalErrorMessage } from "@services/rentals";
import type { RentalDetail } from "@/types/rental-types";
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
  } = useStaffRentalDetailQuery(rentalId, true);

  const endRentalMutation = useStaffEndRentalMutation();

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
    return rentalDetailData as RentalDetail | undefined;
  }, [rentalDetailData]);

  const handleStaffEndRental = useCallback(
    ({ endStation, reason }: { endStation: string; reason: string }) => {
      endRentalMutation.mutate(
        { rentalId, endStation, reason },
        {
          onSuccess: () => {
            Alert.alert("Thành công", "Đã kết thúc phiên thuê cho khách.");
            refetchRental();
          },
          onError: (error) => {
            Alert.alert("Thất bại", rentalErrorMessage(error));
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
          <RentalStatusCard status={booking.status} />
          <AdminBikeInfoCard booking={booking} />
          <RentalTimeInfoCard rental={booking} />
          <RentalPaymentInfoCard rental={booking} />
          <RentalBookingIdCard rentalId={booking.id} />
          <AdminUserInfoCard booking={booking} />

          {booking.status === "RENTED" && (
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
