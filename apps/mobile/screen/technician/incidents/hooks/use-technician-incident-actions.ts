import { Alert } from "react-native";

import type { AssignmentStatus } from "@/contracts/server";

import { useAcceptIncidentMutation } from "@/screen/incidents/hooks/use-accept-incident-mutation";
import { useRejectIncidentMutation } from "@/screen/incidents/hooks/use-reject-incident-mutation";
import { useResolveIncidentMutation } from "@/screen/incidents/hooks/use-resolve-incident-mutation";
import { useStartIncidentMutation } from "@/screen/incidents/hooks/use-start-incident-mutation";
import { presentIncidentError } from "@/screen/incidents/incident-presenters";

type ActionKind = "assigned" | "accepted" | "in_progress";

type UseTechnicianIncidentActionsParams = {
  assignmentStatus: AssignmentStatus | null;
  incidentId: string;
  onRejected?: () => void;
};

function showMutationError(error: unknown) {
  if (error) {
    Alert.alert("Lỗi", presentIncidentError(error as never));
  }
}

export function useTechnicianIncidentActions({
  assignmentStatus,
  incidentId,
  onRejected,
}: UseTechnicianIncidentActionsParams) {
  const acceptIncidentMutation = useAcceptIncidentMutation();
  const rejectIncidentMutation = useRejectIncidentMutation();
  const startIncidentMutation = useStartIncidentMutation();
  const resolveIncidentMutation = useResolveIncidentMutation();

  const actionKind: ActionKind | null = assignmentStatus === "ASSIGNED"
    ? "assigned"
    : assignmentStatus === "ACCEPTED"
      ? "accepted"
      : assignmentStatus === "IN_PROGRESS"
        ? "in_progress"
        : null;

  const handleAccept = () => {
    Alert.alert(
      "Nhận xử lý sự cố",
      "Xác nhận nhận xử lý sự cố này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Nhận xử lý",
          onPress: async () => {
            try {
              await acceptIncidentMutation.mutateAsync(incidentId);
            }
            catch (error) {
              showMutationError(error);
            }
          },
        },
      ],
    );
  };

  const handleReject = () => {
    Alert.alert(
      "Từ chối sự cố",
      "Nếu từ chối, hệ thống sẽ điều phối kỹ thuật viên khác cho sự cố này.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            try {
              await rejectIncidentMutation.mutateAsync(incidentId);
              onRejected?.();
            }
            catch (error) {
              showMutationError(error);
            }
          },
        },
      ],
    );
  };

  const handleStart = () => {
    Alert.alert(
      "Bắt đầu xử lý",
      "Xác nhận bắt đầu xử lý sự cố này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bắt đầu",
          onPress: async () => {
            try {
              await startIncidentMutation.mutateAsync(incidentId);
            }
            catch (error) {
              showMutationError(error);
            }
          },
        },
      ],
    );
  };

  const handleResolve = () => {
    Alert.alert(
      "Hoàn tất sự cố",
      "Xác nhận đã xử lý xong sự cố này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Hoàn tất",
          onPress: async () => {
            try {
              await resolveIncidentMutation.mutateAsync(incidentId);
            }
            catch (error) {
              showMutationError(error);
            }
          },
        },
      ],
    );
  };

  return {
    actionKind,
    isAccepting: acceptIncidentMutation.isPending,
    isRejecting: rejectIncidentMutation.isPending,
    isStarting: startIncidentMutation.isPending,
    isResolving: resolveIncidentMutation.isPending,
    handleAccept,
    handleReject,
    handleStart,
    handleResolve,
  };
}
