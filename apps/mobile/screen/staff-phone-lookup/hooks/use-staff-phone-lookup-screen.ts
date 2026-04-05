import { useStaffActiveRentalsByPhone } from "@hooks/query/rentals/use-staff-active-rentals-by-phone";
import { useStationActions } from "@hooks/useStationAction";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import type { RentalListItem } from "@/types/rental-types";

import { presentRentalError } from "@/presenters/rentals/rental-error-presenter";

const LOOKUP_DEBOUNCE_MS = 350;
const MIN_LOOKUP_PHONE_LENGTH = 8;

type EmptyStateCopy = {
  title: string;
  description: string;
};

export function useStaffPhoneLookupScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const normalizedPhone = phoneNumber.trim();
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

  const stationNameMap = useMemo(() => {
    if (!stationData) {
      return new Map<string, string>();
    }

    return new Map<string, string>(stationData.map(station => [station.id, station.name]));
  }, [stationData]);

  const isDebouncing = canLookup && lookupPhone !== normalizedPhone;
  const isShowingResolvedLookup = lookupPhone === normalizedPhone && canLookup;
  const results = isShowingResolvedLookup ? (lookupQuery.data?.data ?? []) : [];
  const hasResults = results.length > 0;
  const isLoading = isLoadingGetAllStations || (canLookup && (isDebouncing || (lookupQuery.isFetching && !hasResults)));
  const lookupErrorDescription = lookupQuery.error ? presentRentalError(lookupQuery.error) : null;

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
        description: lookupErrorDescription ?? "Không thể tải kết quả tra cứu.",
      };
    }

    return {
      title: "Không tìm thấy phiên thuê",
      description: "Số điện thoại này hiện không có phiên thuê nào đang hoạt động.",
    };
  }, [canLookup, isShowingResolvedLookup, lookupErrorDescription, lookupQuery.isError, normalizedPhone.length]);

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
      return Promise.resolve();
    }

    setIsRefreshing(true);
    return lookupQuery.refetch().finally(() => {
      setIsRefreshing(false);
    });
  }, [lookupPhone, lookupQuery]);

  const getStationName = useCallback((id: string) => stationNameMap.get(id) ?? id, [stationNameMap]);

  return {
    emptyState,
    getStationName,
    handleClear,
    handleLookup,
    handleRefresh,
    isLoading,
    isRefreshing,
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
  handleRefresh: () => Promise<unknown>;
  isLoading: boolean;
  isRefreshing: boolean;
  phoneNumber: string;
  results: RentalListItem[];
  setPhoneNumber: (value: string) => void;
  showResultsHeader: boolean;
};
