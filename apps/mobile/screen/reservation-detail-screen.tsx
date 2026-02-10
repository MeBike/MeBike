import { useGetStationLookupQuery } from "@hooks/query/Reservation/useGetStationLookupQuery";
import { useReservationActions } from "@hooks/useReservationActions";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  ReservationDetailNavigationProp,
  ReservationDetailRouteProp,
} from "../types/navigation";
import type { Reservation } from "../types/reservation-types";

import { ActionButtons } from "./components/action-buttons";
import { ErrorState } from "./components/error-state";
import { LoadingState } from "./components/loading-state";
import { ReservationHeader, ReservationSummary } from "./components/reservation-header";
import { ReservationInfo } from "./components/reservation-info";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  header: {
    paddingTop: 0,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
});

function ReservationDetailScreen() {
  const navigation = useNavigation<ReservationDetailNavigationProp>();
  const route = useRoute<ReservationDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthNext();

  const hasToken = isAuthenticated;

  const { reservationId, reservation: initialReservation } = route.params;

  const {
    reservationDetail,
    fetchReservationDetail,
    isReservationDetailLoading,
    confirmReservation,
    cancelReservation,
    isConfirmingReservation,
    isCancellingReservation,
  } = useReservationActions({
    hasToken,
    reservationId,
    enableDetailQuery: !initialReservation,
  });

  const stationIdForLookup
    = reservationDetail?.station_id ?? initialReservation?.station_id;

  const { data: stationLookup } = useGetStationLookupQuery(
    stationIdForLookup,
    Boolean(stationIdForLookup) && !(initialReservation?.station || reservationDetail?.station),
  );

  const reservation: Reservation | undefined = useMemo(() => {
    return reservationDetail ?? initialReservation;
  }, [initialReservation, reservationDetail]);

  const resolvedStation = useMemo(() => {
    if (!reservation) {
      return undefined;
    }
    if (reservation.station) {
      return reservation.station;
    }
    if (stationLookup) {
      return {
        _id: stationLookup._id,
        name: stationLookup.name,
        address: stationLookup.address,
      };
    }
    return undefined;
  }, [reservation, stationLookup]);

  useEffect(() => {
    if (!initialReservation) {
      fetchReservationDetail();
    }
  }, [fetchReservationDetail, initialReservation]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleConfirm = useCallback(() => {
    if (!reservation) {
      return;
    }
    Alert.alert(
      "Xác nhận bắt đầu",
      "Bạn chắc chắn muốn bắt đầu chuyến đi với lượt đặt trước này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bắt đầu",
          onPress: () =>
            confirmReservation(reservationId, {
              onSuccess: () => {
                fetchReservationDetail();
                navigation.replace("BookingHistoryDetail", { bookingId: reservationId });
              },
            }),
        },
      ],
    );
  }, [confirmReservation, fetchReservationDetail, reservation, reservationId, navigation]);

  const handleCancel = useCallback(() => {
    if (!reservation) {
      return;
    }
    Alert.alert(
      "Huỷ đặt trước",
      "Bạn có chắc chắn muốn huỷ lượt đặt trước này không?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Huỷ đặt",
          style: "destructive",
          onPress: () =>
            cancelReservation(reservationId, undefined, {
              onSuccess: () => {
                fetchReservationDetail();
                navigation.goBack();
              },
            }),
        },
      ],
    );
  }, [cancelReservation, fetchReservationDetail, reservation, reservationId, navigation]);

  if (!reservation && isReservationDetailLoading) {
    return <LoadingState message="Đang tải chi tiết đặt trước..." />;
  }

  if (!reservation) {
    return <ErrorState onGoBack={handleGoBack} />;
  }

  const isPending = reservation.status === "ĐANG CHỜ XỬ LÍ";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <ReservationHeader onGoBack={handleGoBack} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <ReservationSummary
            status={reservation.status}
            bikeId={reservation.bike_id}
            reservationId={reservation._id}
          />

          <ReservationInfo
            reservation={reservation}
            stationName={resolvedStation?.name}
            stationAddress={resolvedStation?.address}
          />
        </View>

        <ActionButtons
          isPending={isPending}
          isConfirming={isConfirmingReservation}
          isCancelling={isCancellingReservation}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </ScrollView>
    </View>
  );
}

export default ReservationDetailScreen;
