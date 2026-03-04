import { useReservationFlowData } from "./use-reservation-flow-data";
import { useReservationFlowState } from "./use-reservation-flow-state";
import { useReservationFlowSubmit } from "./use-reservation-flow-submit";

export function useReservationFlow() {
  const data = useReservationFlowData();

  const state = useReservationFlowState({
    initialMode: data.initialMode,
    initialSubscriptionId: data.initialSubscriptionId,
    lockPaymentSelection: data.lockPaymentSelection,
    activeSubscriptions: data.activeSubscriptions,
    subscriptionsLoaded: data.subscriptionsLoaded,
  });

  const { handleSubmit } = useReservationFlowSubmit({
    bikeId: data.bikeId,
    stationId: data.stationId,
    mode: state.mode,
    scheduledAt: state.scheduledAt,
    selectedSubscriptionId: state.selectedSubscriptionId,
    activeSubscriptions: state.activeSubscriptions,
    hasToken: data.hasToken,
    navigation: data.navigation,
    createReservation: data.createReservation,
    setIsSubmitting: state.setIsSubmitting,
  });

  return {
    insets: data.insets,
    navigation: data.navigation,
    stationName: data.stationName,
    stationAddress: data.stationAddress,
    bikeName: data.bikeName,
    lockPaymentSelection: state.lockPaymentSelection,
    mode: state.mode,
    modeOptions: state.modeOptions,
    handleModeChange: state.handleModeChange,
    activeSubscriptions: state.activeSubscriptions,
    selectedSubscriptionId: state.selectedSubscriptionId,
    setSelectedSubscriptionId: state.setSelectedSubscriptionId,
    scheduledAt: state.scheduledAt,
    formatVietnamTime: state.formatVietnamTime,
    handleOpenTimePicker: state.handleOpenTimePicker,
    iosPickerVisible: state.iosPickerVisible,
    setIosPickerVisible: state.setIosPickerVisible,
    iosPickerValue: state.iosPickerValue,
    setIosPickerValue: state.setIosPickerValue,
    handleConfirmIOSPicker: state.handleConfirmIOSPicker,
    isSubmitting: state.isSubmitting,
    handleSubmit,
  };
}
