import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { Alert, Pressable, ScrollView, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack } from "tamagui";

import { IconSymbol } from "@components/IconSymbol";
import { useGetStationLookupQuery } from "@hooks/query/reservation/use-get-station-lookup-query";
import { useReservationActions } from "@hooks/use-reservation-actions";
import { useAuthNext } from "@providers/auth-provider-next";
import { radii, spaceScale } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import { Screen } from "@ui/primitives/screen";

import type {
  ReservationDetailNavigationProp,
  ReservationDetailRouteProp,
} from "../types/navigation";
import type { Reservation } from "../types/reservation-types";

import { DetailActions } from "./reservation-detail/components/detail-actions";
import { DetailErrorState } from "./reservation-detail/components/detail-error-state";
import { DetailLoadingState } from "./reservation-detail/components/detail-loading-state";
import { DetailSummaryCard } from "./reservation-detail/components/detail-summary-card";

function ReservationDetailScreen() {
  const navigation = useNavigation<ReservationDetailNavigationProp>();
  const route = useRoute<ReservationDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
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
    enableDetailQuery: hasToken && Boolean(reservationId),
  });

  const stationIdForLookup
    = reservationDetail?.stationId ?? initialReservation?.stationId;

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
        id: stationLookup.id,
        name: stationLookup.name,
        address: stationLookup.address,
      };
    }
    return undefined;
  }, [reservation, stationLookup]);

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
              onSuccess: ({ rentalId }) => {
                fetchReservationDetail();
                navigation.replace("BookingHistoryDetail", { bookingId: rentalId });
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
    return (
      <Screen>
        <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />
        <DetailLoadingState />
      </Screen>
    );
  }

  if (!reservation) {
    return (
      <Screen>
        <DetailErrorState onGoBack={handleGoBack} />
      </Screen>
    );
  }

  const isPending = reservation.status === "PENDING";
  const actionBarHeight = isPending ? 168 + Math.max(insets.bottom, spaceScale[4]) : spaceScale[9];

  return (
    <Screen>
      <StatusBar backgroundColor={theme.actionPrimary.val} barStyle="light-content" />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: actionBarHeight,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <YStack>
          <YStack
            backgroundColor="$actionPrimary"
            borderBottomLeftRadius={32}
            borderBottomRightRadius={32}
            paddingTop={insets.top + spaceScale[4]}
            paddingHorizontal="$5"
            paddingBottom={68}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spaceScale[3], paddingRight: 72 }}>
              <Pressable
                accessibilityLabel="Quay lại"
                onPress={handleGoBack}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radii.round,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.overlayGlass.val,
                }}
              >
                <IconSymbol color={theme.onSurfaceBrand.val} name="arrow-left" size="lg" />
              </Pressable>
              <AppText numberOfLines={1} selectable tone="inverted" variant="xlTitle">
                Chi tiết đặt trước
              </AppText>
            </View>
          </YStack>

          <YStack marginTop={-spaceScale[9]} paddingHorizontal="$5">
            <DetailSummaryCard
              reservation={reservation}
              stationAddress={resolvedStation?.address}
              stationName={resolvedStation?.name}
            />
          </YStack>
        </YStack>
      </ScrollView>

      {isPending
        ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <DetailActions
                bottomInset={insets.bottom}
                isCancelling={isCancellingReservation}
                isConfirming={isConfirmingReservation}
                isPending={isPending}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
              />
            </View>
          )
        : null}
    </Screen>
  );
}

export default ReservationDetailScreen;
