import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

import { useCreateFixedSlotTemplateMutation } from "@hooks/mutations/FixedSlots/useCreateFixedSlotTemplateMutation";
import { useUpdateFixedSlotTemplateMutation } from "@hooks/mutations/FixedSlots/useUpdateFixedSlotTemplateMutation";
import { useFixedSlotTemplateDetailQuery } from "@hooks/query/FixedSlots/useFixedSlotTemplateDetailQuery";
import { useGetStationById } from "@hooks/query/Station/useGetStationByIDQuery";
import { getApiErrorMessage } from "@utils/error";

import type {
  FixedSlotEditorNavigationProp,
  FixedSlotEditorRouteProp,
} from "@/types/navigation";

import {
  filterFutureDates,
  formatDate,
  formatTime,
  getTomorrowDate,
  timeStringToDate,
} from "./editorUtils";

export type FixedSlotEditorHookParams = {
  navigation: FixedSlotEditorNavigationProp;
  routeParams?: FixedSlotEditorRouteProp["params"];
};

export function useFixedSlotEditor({ navigation, routeParams }: FixedSlotEditorHookParams) {
  const queryClient = useQueryClient();
  const { stationId: initialStationId, stationName, templateId } = routeParams ?? {};
  const isEditMode = Boolean(templateId);
  const canEditStation = !isEditMode && !initialStationId;

  const [stationId, setStationId] = useState(initialStationId ?? "");
  const [slotStart, setSlotStart] = useState(formatTime(new Date()));
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [pastDatesHidden, setPastDatesHidden] = useState(0);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerValue, setTimePickerValue] = useState(() => timeStringToDate(formatTime(new Date())));
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(getTomorrowDate());

  const createMutation = useCreateFixedSlotTemplateMutation();
  const updateMutation = useUpdateFixedSlotTemplateMutation();
  const { data: templateData, isLoading: isDetailLoading } = useFixedSlotTemplateDetailQuery(
    templateId,
    isEditMode,
  );

  const lookupStationId = !canEditStation
    ? templateData?.station_id
    : (stationId.length >= 6 ? stationId : "");
  const { data: fetchedStation } = useGetStationById(lookupStationId ?? "");

  const resolvedStationName = stationName ?? templateData?.station_name ?? fetchedStation?.name;
  const isMutating = createMutation.isPending || updateMutation.isPending;
  const headerTitle = isEditMode ? "Chỉnh sửa khung giờ" : "Tạo khung giờ";
  const submitLabel = isMutating
    ? (isEditMode ? "Đang lưu..." : "Đang tạo...")
    : (isEditMode ? "Lưu thay đổi" : "Lưu khung giờ");

  useEffect(() => {
    if (templateData) {
      setStationId(templateData.station_id);
      setSlotStart(templateData.slot_start);
      setTimePickerValue(timeStringToDate(templateData.slot_start));
      const futureDates = filterFutureDates(templateData.selected_dates ?? []).sort();
      setSelectedDates(futureDates);
      setPastDatesHidden((templateData.selected_dates?.length ?? 0) - futureDates.length);
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
    setSelectedDates((prev) => prev.filter((item) => item !== value));
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
        value: new Date(),
        is24Hour: true,
        onChange: (event, date) => {
          if (event.type === "set" && date) {
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

    const payload = { slot_start: slotStart, selected_dates: selectedDates };

    if (isEditMode && templateId) {
      updateMutation.mutate(
        { id: templateId, data: payload },
        {
          onSuccess: async () => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["fixed-slots"] }),
              queryClient.invalidateQueries({ queryKey: ["fixed-slots", "detail", templateId] }),
            ]);
            Alert.alert("Đã lưu", "Khung giờ đã được cập nhật.");
            navigation.goBack();
          },
          onError: () => {
          Alert.alert(
            "Không thể cập nhật",
            getApiErrorMessage(error, "Vui lòng thử lại."),
          );
        },
      },
    );
      return;
    }

    createMutation.mutate(
      { station_id: normalizedStationId, ...payload },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ["fixed-slots"] });
          Alert.alert("Thành công", "Đã tạo khung giờ cố định.");
          AsyncStorage.removeItem("fixedSlots:lastCreated").catch(() => {});
          navigation.goBack();
        },
        onError: (error) => {
          Alert.alert(
            "Không thể tạo khung giờ",
            getApiErrorMessage(error, "Vui lòng thử lại."),
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
