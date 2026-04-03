import { log } from "@lib/log";
import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import type { MyRentalResolvedDetail } from "@/types/rental-types";

import { useCreateIncidentMutation } from "../../incidents/hooks/use-create-incident-mutation";
import { useRentalIncidentQuery } from "../../incidents/hooks/use-rental-incident-query";
import { isIncidentTerminalStatus, presentIncidentError } from "../../incidents/incident-presenters";

async function resolveIncidentCoordinates() {
  const currentPermission = await Location.getForegroundPermissionsAsync();
  log.debug("Incident location permission", {
    canAskAgain: currentPermission.canAskAgain,
    granted: currentPermission.granted,
    status: currentPermission.status,
  });
  const providerStatus = await Location.getProviderStatusAsync();
  log.debug("Incident location provider status", providerStatus);
  const permission = currentPermission.status === "granted"
    ? currentPermission
    : await Location.requestForegroundPermissionsAsync();

  if (currentPermission.status !== "granted") {
    log.debug("Incident location permission request result", {
      canAskAgain: permission.canAskAgain,
      granted: permission.granted,
      status: permission.status,
    });
  }

  if (permission.status !== "granted") {
    log.warn("Incident location denied", {
      canAskAgain: permission.canAskAgain,
      status: permission.status,
    });
    return null;
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  log.debug("Incident location services enabled check", { servicesEnabled });

  if (!servicesEnabled) {
    log.warn("Incident location services disabled");
    return null;
  }

  try {
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: false,
    });

    log.debug("Incident current position success", {
      accuracy: currentLocation.coords.accuracy,
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      mocked: currentLocation.mocked,
      timestamp: currentLocation.timestamp,
    });

    return {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };
  }
  catch (currentPositionError) {
    log.warn("Incident current position failed", currentPositionError);
    return null;
  }
}

type UseBookingIncidentStateOptions = {
  bookingId: string;
  booking?: MyRentalResolvedDetail["rental"];
};

export function useBookingIncidentState({
  bookingId,
  booking,
}: UseBookingIncidentStateOptions) {
  const isOngoing = booking?.status === "RENTED";
  const [isIncidentSheetOpen, setIncidentSheetOpen] = useState(false);
  const [isSubmittingIncidentReport, setSubmittingIncidentReport] = useState(false);
  const createIncidentMutation = useCreateIncidentMutation();

  const rentalIncidentQuery = useRentalIncidentQuery(bookingId, isOngoing);
  const rentalIncident = rentalIncidentQuery.data ?? null;
  const isReportingIncident = isSubmittingIncidentReport || createIncidentMutation.isPending;
  const hasActiveIncident = Boolean(rentalIncident && !isIncidentTerminalStatus(rentalIncident.status));

  const handleOpenIncidentSheet = useCallback(() => {
    setIncidentSheetOpen(true);
  }, []);

  const handleCloseIncidentSheet = useCallback(() => {
    if (isReportingIncident) {
      return;
    }

    setIncidentSheetOpen(false);
  }, [isReportingIncident]);

  const handleSelectIncidentType = useCallback(async (incidentType: string) => {
    if (!booking || isReportingIncident) {
      return;
    }

    setSubmittingIncidentReport(true);

    try {
      const coordinates = await resolveIncidentCoordinates();

      if (!coordinates) {
        Alert.alert(
          "Không thể báo cáo sự cố",
          "Vui lòng bật dịch vụ vị trí và cấp quyền vị trí để gửi yêu cầu hỗ trợ.",
        );
        return;
      }

      await createIncidentMutation.mutateAsync({
        rentalId: booking.id,
        bikeId: booking.bikeId,
        incidentType,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      setIncidentSheetOpen(false);
    }
    catch (error) {
      Alert.alert("Không thể báo cáo sự cố", presentIncidentError(error as Parameters<typeof presentIncidentError>[0]));
    }
    finally {
      setSubmittingIncidentReport(false);
    }
  }, [booking, createIncidentMutation, isReportingIncident]);

  return {
    handleCloseIncidentSheet,
    handleOpenIncidentSheet,
    handleSelectIncidentType,
    hasActiveIncident,
    isIncidentSheetOpen,
    isOngoing,
    isReportingIncident,
    rentalIncident,
    rentalIncidentQuery,
  };
}
