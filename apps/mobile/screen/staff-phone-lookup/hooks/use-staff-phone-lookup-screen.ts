import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

import type { RentalListItem } from "@/types/rental-types";

import { presentRentalError } from "@/presenters/rentals/rental-error-presenter";
import { useStaffActiveRentalsByPhone } from "@hooks/query/rentals/use-staff-active-rentals-by-phone";
import { useStationActions } from "@hooks/useStationAction";

const LOOKUP_DEBOUNCE_MS = 350;
const MIN_LOOKUP_PHONE_LENGTH = 8;

type EmptyStateCopy = {
  title: string;
  description: string;
};

export function useStaffPhoneLookupScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const normalizedPhone = phoneNumber.trim();
  const lastErrorAtRef = useRef(0);
  const { stations: stationData, isLoadingGetAllStations } = useStationActions(true);

  const canLookup = normalizedPhone.length >= MIN_LOOKUP_PHONE_LENGTH;

  useEffect(() => {
    if (!canLookup) {
      setLookupPhone(current => (current.length > 0 ? "" : current));
      return;
    }

    const timeoutId = setTimeout(() => {
      setLookupPhone(current => (current === normalizedPhone ? current : normalizedPhone));
    }, LOOKUP_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [canLookup, normalizedPhone]);

  const lookupQuery = useStaffActiveRentalsByPhone({
    phone: lookupPhone,
    enabled: lookupPhone.length >= MIN_LOOKUP_PHONE_LENGTH,
  });

  useEffect(() => {
    if (!lookupQuery.error || lookupQuery.errorUpdatedAt === 0) {
      return;
    }

    if (lookupQuery.errorUpdatedAt === lastErrorAtRef.current) {
      return;
    }

    lastErrorAtRef.current = lookupQuery.errorUpdatedAt;
    Alert.alert("Lỗi tra cứu", presentRentalError(lookupQuery.error));
  }, [lookupQuery.error, lookupQuery.errorUpdatedAt]);

  const stationNameMap = useMemo(() => {
    if (!stationData) {
      return new Map<string, string>();
    }

    return new Map<string, string>(stationData.map(station => [station.id, station.name]));
  }, [stationData]);

  const isDebouncing = canLookup && lookupPhone !== normalizedPhone;
  const isShowingResolvedLookup = lookupPhone === normalizedPhone && canLookup;
  const results = isShowingResolvedLookup ? (lookupQuery.data?.data ?? []) : [];
  const isLoading = isLoadingGetAllStations || (canLookup && (isDebouncing || lookupQuery.isFetching));

  const emptyState = useMemo<EmptyStateCopy>(() => {
    if (!normalizedPhone.length) {
      return {
        title: "Nhập số điện thoại để tìm",
        description: "Tìm phiên thuê đang hoạt động của khách khi không thể quét QR.",
      };
    }

    if (!canLookup) {
      return {
        title: "Cần thêm chữ số",
        description: `Nhập ít nhất ${MIN_LOOKUP_PHONE_LENGTH} số để bắt đầu tra cứu.`,
      };
    }

    if (lookupQuery.isError && isShowingResolvedLookup) {
      return {
        title: "Không thể tải kết quả",
        description: "Kéo xuống để thử lại hoặc kiểm tra lại số điện thoại.",
      };
    }

    return {
      title: "Không tìm thấy phiên thuê",
      description: "Số điện thoại này hiện không có phiên thuê nào đang hoạt động.",
    };
  }, [canLookup, isShowingResolvedLookup, lookupQuery.isError, normalizedPhone.length]);

  const handleLookup = useCallback(() => {
    if (!canLookup) {
      Alert.alert(
        "Thiếu số điện thoại",
        `Vui lòng nhập ít nhất ${MIN_LOOKUP_PHONE_LENGTH} số để tra cứu.`,
      );
      return;
    }

    if (lookupPhone === normalizedPhone) {
      void lookupQuery.refetch();
      return;
    }

    setLookupPhone(current => (current === normalizedPhone ? current : normalizedPhone));
  }, [canLookup, lookupPhone, lookupQuery, normalizedPhone]);

  const handleClear = useCallback(() => {
    setPhoneNumber("");
    setLookupPhone("");
  }, []);

  const handleRefresh = useCallback(() => {
    if (lookupPhone.length < MIN_LOOKUP_PHONE_LENGTH) {
      return;
    }

    void lookupQuery.refetch();
  }, [lookupPhone, lookupQuery]);

  const getStationName = useCallback((id: string) => stationNameMap.get(id) ?? id, [stationNameMap]);

  return {
    emptyState,
    getStationName,
    handleClear,
    handleLookup,
    handleRefresh,
    isLoading,
    phoneNumber,
    results,
    setPhoneNumber,
    showResultsHeader: results.length > 0 && !isLoading,
  };
}

export type StaffPhoneLookupScreenState = {
  emptyState: EmptyStateCopy;
  getStationName: (id: string) => string;
  handleClear: () => void;
  handleLookup: () => void;
  handleRefresh: () => void;
  isLoading: boolean;
  phoneNumber: string;
  results: RentalListItem[];
  setPhoneNumber: (value: string) => void;
  showResultsHeader: boolean;
};
