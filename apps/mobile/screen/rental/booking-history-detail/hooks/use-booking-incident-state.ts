import type { UploadIncidentImagePayload } from "@services/incidents";

import { log } from "@lib/log";
import { incidentService } from "@services/incidents";
import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import type { MyRentalResolvedDetail } from "@/types/rental-types";

import { useCurrentLocation } from "@/providers/location-provider";
import { useCreateIncidentMutation } from "@/screen/incidents/hooks/use-create-incident-mutation";
import { useRentalIncidentQuery } from "@/screen/incidents/hooks/use-rental-incident-query";
import { isIncidentTerminalStatus, presentIncidentError } from "@/screen/incidents/incident-presenters";

const MANUAL_INCIDENT_TYPE = "GENERAL_REPORT";

type Coordinates = {
  latitude: number;
  longitude: number;
};

async function resolveIncidentCoordinates(cachedLocation: Coordinates | null) {
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

    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: 2 * 60 * 1000,
      requiredAccuracy: 500,
    });

    const isRecentLastKnown = lastKnown
      ? Date.now() - lastKnown.timestamp <= 2 * 60 * 1000
      : false;

    log.debug("Incident last known lookup", {
      accuracy: lastKnown?.coords.accuracy,
      ageMs: lastKnown ? Date.now() - lastKnown.timestamp : null,
      found: Boolean(lastKnown),
      isRecentLastKnown,
      latitude: lastKnown?.coords.latitude,
      longitude: lastKnown?.coords.longitude,
      mocked: lastKnown?.mocked,
      timestamp: lastKnown?.timestamp,
    });

    if (lastKnown && isRecentLastKnown) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
      };
    }

    if (cachedLocation) {
      log.debug("Incident falling back to cached provider location", cachedLocation);
      return cachedLocation;
    }

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
  const { location: currentLocation } = useCurrentLocation();
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

  const handleSelectIncidentType = useCallback(async (
    params: {
      incidentType: string;
      imageUploads: UploadIncidentImagePayload[];
    },
  ) => {
    if (!booking || isReportingIncident) {
      return;
    }

    setSubmittingIncidentReport(true);

    try {
      const coordinates = await resolveIncidentCoordinates(currentLocation);
      let fileUrls: string[] = [];

      if (!coordinates) {
        Alert.alert(
          "Không thể báo cáo sự cố",
          "Vui lòng bật dịch vụ vị trí và cấp quyền vị trí để gửi yêu cầu hỗ trợ.",
        );
        return;
      }

      if (params.imageUploads.length > 0) {
        const uploadResult = await incidentService.uploadIncidentImages(params.imageUploads);
        if (!uploadResult.ok) {
          throw uploadResult.error;
        }

        fileUrls = uploadResult.value.fileUrls;
      }

      await createIncidentMutation.mutateAsync({
        rentalId: booking.id,
        bikeId: booking.bikeId,
        incidentType: MANUAL_INCIDENT_TYPE,
        description: params.incidentType,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        fileUrls,
      });

      setIncidentSheetOpen(false);
    }
    catch (error) {
      Alert.alert("Không thể báo cáo sự cố", presentIncidentError(error as Parameters<typeof presentIncidentError>[0]));
    }
    finally {
      setSubmittingIncidentReport(false);
    }
  }, [booking, createIncidentMutation, currentLocation, isReportingIncident]);

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
