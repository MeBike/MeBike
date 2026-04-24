import { useCreateFixedSlotTemplateMutation } from "@hooks/mutations/fixed-slots/use-create-fixed-slot-template-mutation";
import { useUpdateFixedSlotTemplateMutation } from "@hooks/mutations/fixed-slots/use-update-fixed-slot-template-mutation";
import { fixedSlotQueryKeys } from "@hooks/query/fixed-slots/fixed-slot-query-keys";
import { useFixedSlotTemplateDetailQuery } from "@hooks/query/fixed-slots/use-fixed-slot-template-detail-query";
import { useGetStationDetailQuery } from "@hooks/query/stations/use-get-station-detail-query";
import { useAuthNext } from "@providers/auth-provider-next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

import type {
  FixedSlotEditorNavigationProp,
  FixedSlotEditorRouteProp,
} from "@/types/navigation";

import { presentFixedSlotError } from "@/presenters/fixed-slots/fixed-slot-presenter";
import {
  getFixedSlotOperatingHoursMessage,
  isWallClockWithinOvernightOperationsWindow,
  parseTimeStringToWallClockDate,
} from "@/utils/business-hours";

import {
  filterFutureDates,
  formatDate,
  formatTime,
  getTomorrowDate,
  timeStringToDate,
} from "./editor-utils";

export type FixedSlotEditorHookParams = {
  navigation: FixedSlotEditorNavigationProp;
  routeParams?: FixedSlotEditorRouteProp["params"];
};

function getDefaultSlotStartDate(): Date {
  const now = new Date();

  if (isWallClockWithinOvernightOperationsWindow(now)) {
    now.setHours(5, 0, 0, 0);
    return now;
  }

  now.setSeconds(0, 0);
  return now;
}

export function useFixedSlotEditor({ navigation, routeParams }: FixedSlotEditorHookParams) {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthNext();
  const { stationId: initialStationId, stationName, templateId } = routeParams ?? {};
  const isEditMode = Boolean(templateId);
  const canEditStation = !isEditMode && !initialStationId;

  const [stationId, setStationId] = useState(initialStationId ?? "");
  const [slotStart, setSlotStart] = useState(() => formatTime(getDefaultSlotStartDate()));
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [pastDatesHidden, setPastDatesHidden] = useState(0);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerValue, setTimePickerValue] = useState(() => getDefaultSlotStartDate());
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(getTomorrowDate());

  const createMutation = useCreateFixedSlotTemplateMutation();
  const updateMutation = useUpdateFixedSlotTemplateMutation();
  const { data: templateData, isLoading: isDetailLoading } = useFixedSlotTemplateDetailQuery(
    templateId,
    isEditMode && isAuthenticated,
    user?.id,
  );

  const lookupStationId = !canEditStation
    ? templateData?.station.id
    : (stationId.length >= 6 ? stationId : "");
  const { data: fetchedStation } = useGetStationDetailQuery(lookupStationId ?? "");

  const resolvedStationName = stationName ?? templateData?.station.name ?? fetchedStation?.name;
  const isMutating = createMutation.isPending || updateMutation.isPending;
  const headerTitle = isEditMode ? "Chỉnh sửa lịch đặt cố định" : "Tạo lịch đặt cố định";
  const submitLabel = isMutating
    ? (isEditMode ? "Đang lưu..." : "Đang tạo...")
    : (isEditMode ? "Lưu thay đổi" : "Tạo lịch cố định");

  useEffect(() => {
    if (templateData) {
      setStationId(templateData.station.id);
      setSlotStart(templateData.slotStart);
      setTimePickerValue(timeStringToDate(templateData.slotStart));
      const futureDates = filterFutureDates(templateData.slotDates ?? []).sort();
      setSelectedDates(futureDates);
      setPastDatesHidden((templateData.slotDates?.length ?? 0) - futureDates.length);
    }
  }, [templateData]);

  const addDateToSelection = useCallback((value: string) => {
    setSelectedDates((prev) => {
      if (prev.includes(value))
        return prev;
      const updated = [...prev, value];
      updated.sort();
      return updated;
    });
  }, []);

  const removeDate = useCallback((value: string) => {
    setSelectedDates(prev => prev.filter(item => item !== value));
  }, []);

  const handleAddDate = useCallback(() => {
    const minDate = getTomorrowDate();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: minDate,
        minimumDate: minDate,
        onChange: (event, date) => {
          if (event.type === "set" && date) {
            addDateToSelection(formatDate(date));
          }
        },
      });
      return;
    }
    setDatePickerValue(minDate);
    setDateModalVisible(true);
  }, [addDateToSelection]);

  const handleDatePickerChange = useCallback((_: unknown, date?: Date) => {
    if (date)
      setDatePickerValue(date);
  }, []);

  const confirmDatePicker = useCallback(() => {
    addDateToSelection(formatDate(datePickerValue));
    setDateModalVisible(false);
  }, [addDateToSelection, datePickerValue]);

  const cancelDatePicker = useCallback(() => {
    setDateModalVisible(false);
  }, []);

  const handleSelectTime = useCallback(() => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "time",
        value: timeStringToDate(slotStart),
        is24Hour: true,
        onChange: (event, date) => {
          if (event.type === "set" && date) {
            if (isWallClockWithinOvernightOperationsWindow(date)) {
              Alert.alert("Giờ không hợp lệ", getFixedSlotOperatingHoursMessage());
              return;
            }
            setSlotStart(formatTime(date));
          }
        },
      });
      return;
    }
    setTimePickerValue(timeStringToDate(slotStart));
    setTimePickerVisible(true);
  }, [slotStart]);

  const handleTimePickerChange = useCallback((_: unknown, date?: Date) => {
    if (date)
      setTimePickerValue(date);
  }, []);

  const confirmTimePicker = useCallback(() => {
    if (isWallClockWithinOvernightOperationsWindow(timePickerValue)) {
      Alert.alert("Giờ không hợp lệ", getFixedSlotOperatingHoursMessage());
      return;
    }

    setSlotStart(formatTime(timePickerValue));
    setTimePickerVisible(false);
  }, [timePickerValue]);

  const cancelTimePicker = useCallback(() => {
    setTimePickerVisible(false);
  }, []);

  const handleSubmit = useCallback(() => {
    const normalizedStationId = stationId.trim();
    if (!normalizedStationId) {
      Alert.alert(
        "Thiếu trạm",
        isEditMode
          ? "Không tìm thấy thông tin trạm để chỉnh sửa. Vui lòng thử lại."
          : "Vui lòng nhập mã trạm trước khi tạo khung giờ.",
      );
      return;
    }
    if (selectedDates.length === 0) {
      Alert.alert("Thiếu ngày", "Cần ít nhất 1 ngày áp dụng.");
      return;
    }

    if (isWallClockWithinOvernightOperationsWindow(parseTimeStringToWallClockDate(slotStart))) {
      Alert.alert("Giờ không hợp lệ", getFixedSlotOperatingHoursMessage());
      return;
    }

    const payload = { slotStart, slotDates: selectedDates };

    if (isEditMode && templateId) {
      updateMutation.mutate(
        { id: templateId, data: payload },
        {
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["fixed-slots"] }),
              queryClient.invalidateQueries({ queryKey: fixedSlotQueryKeys.detail(user?.id, templateId) }),
            ]);
            Alert.alert("Đã lưu", "Khung giờ đã được cập nhật.");
            navigation.goBack();
          },
          onError: (error) => {
            Alert.alert(
              "Không thể cập nhật",
              presentFixedSlotError(error, "Vui lòng thử lại."),
            );
          },
        },
      );
      return;
    }

    createMutation.mutate(
      { stationId: normalizedStationId, ...payload },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ["fixed-slots"] });
          Alert.alert("Thành công", "Đã tạo lịch cố định. Phí sẽ chỉ được trừ khi hệ thống tạo đặt trước cho từng ngày.");
          AsyncStorage.removeItem("fixedSlots:lastCreated").catch(() => {});
          navigation.goBack();
        },
        onError: (error) => {
          Alert.alert(
            "Không thể tạo khung giờ",
            presentFixedSlotError(error, "Vui lòng thử lại."),
          );
        },
      },
    );
  }, [
    stationId,
    slotStart,
    selectedDates,
    isEditMode,
    templateId,
    updateMutation,
    queryClient,
    navigation,
    createMutation,
    isAuthenticated,
    user?.id,
  ]);

  return {
    headerTitle,
    submitLabel,
    isMutating,
    isEditMode,
    isDetailLoading,
    stationId,
    setStationId,
    resolvedStationName,
    slotStart,
    selectedDates,
    pastDatesHidden,
    handleSelectTime,
    removeDate,
    handleSubmit,
    handleAddDate,
    dateModalVisible,
    datePickerValue,
    handleDatePickerChange,
    confirmDatePicker,
    cancelDatePicker,
    timePickerVisible,
    timePickerValue,
    handleTimePickerChange,
    confirmTimePicker,
    cancelTimePicker,
    stationName,
    canEditStation,
  };
}
