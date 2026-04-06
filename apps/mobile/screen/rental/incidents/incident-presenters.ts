import type { IncidentError } from "@services/incidents";

import { isIncidentApiError } from "@services/incidents";

import type {
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
} from "@/contracts/server";

type BadgeTone = "success" | "warning" | "danger" | "neutral";

const terminalStatuses = new Set<IncidentStatus>(["RESOLVED", "CLOSED", "CANCELLED"]);

export function isIncidentTerminalStatus(status: IncidentStatus) {
  return terminalStatuses.has(status);
}

export function getIncidentStatusLabel(status: IncidentStatus) {
  switch (status) {
    case "OPEN":
      return "Đang chờ hỗ trợ";
    case "ASSIGNED":
      return "Đã điều phối";
    case "IN_PROGRESS":
      return "Đang xử lý";
    case "RESOLVED":
      return "Đã xử lý";
    case "CLOSED":
      return "Đã đóng";
    case "CANCELLED":
      return "Đã hủy";
  }
}

export function getIncidentStatusTone(status: IncidentStatus): BadgeTone {
  switch (status) {
    case "OPEN":
      return "danger";
    case "ASSIGNED":
      return "warning";
    case "IN_PROGRESS":
      return "warning";
    case "RESOLVED":
      return "success";
    case "CLOSED":
      return "neutral";
    case "CANCELLED":
      return "danger";
  }
}

export function getIncidentSeverityLabel(severity: IncidentSeverity) {
  switch (severity) {
    case "LOW":
      return "Mức nhẹ";
    case "MEDIUM":
      return "Mức trung bình";
    case "HIGH":
      return "Mức cao";
    case "CRITICAL":
      return "Khẩn cấp";
  }
}

export function getIncidentSeverityTone(severity: IncidentSeverity): BadgeTone {
  switch (severity) {
    case "LOW":
      return "neutral";
    case "MEDIUM":
      return "warning";
    case "HIGH":
      return "warning";
    case "CRITICAL":
      return "danger";
  }
}

export function getIncidentSourceLabel(source: IncidentSource) {
  switch (source) {
    case "DURING_RENTAL":
      return "Trong chuyến thuê";
    case "POST_RETURN":
      return "Sau khi trả xe";
    case "STAFF_INSPECTION":
      return "Kiểm tra kỹ thuật";
  }
}

export function formatIncidentDistance(distanceMeters: number | null) {
  if (!distanceMeters || distanceMeters <= 0) {
    return null;
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatIncidentDuration(durationSeconds: number | null) {
  if (!durationSeconds || durationSeconds <= 0) {
    return null;
  }

  const minutes = Math.max(1, Math.round(durationSeconds / 60));

  if (minutes < 60) {
    return `${minutes} phút`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }

  return `${hours} giờ ${remainingMinutes} phút`;
}

export function presentIncidentError(error: IncidentError) {
  if (error._tag === "NetworkError") {
    return "Không thể kết nối máy chủ. Vui lòng thử lại.";
  }

  if (error._tag === "DecodeError") {
    return "Không thể đọc dữ liệu sự cố từ máy chủ.";
  }

  if (isIncidentApiError(error)) {
    switch (error.code) {
      case "ACTIVE_INCIDENT_ALREADY_EXISTS":
        return "Đã có sự cố đang được xử lý cho chuyến thuê hoặc xe này.";
      case "NO_AVAILABLE_TECHNICIAN_FOUND":
        return "Hiện chưa tìm thấy kỹ thuật viên khả dụng gần vị trí này.";
      case "NO_NEAREST_STATION_FOUND":
        return "Không tìm thấy trạm phù hợp gần vị trí hiện tại.";
      case "BIKE_NOT_FOUND":
      case "RENTAL_NOT_FOUND":
        return "Không tìm thấy thông tin xe hoặc chuyến thuê để tạo sự cố.";
      case "STATION_NOT_FOUND":
        return "Không tìm thấy trạm liên quan đến sự cố này.";
      case "UNAUTHORIZED_INCIDENT_ACCESS":
        return "Không có quyền truy cập sự cố này.";
      case "VALIDATION_ERROR":
        return "Dữ liệu báo cáo sự cố chưa hợp lệ.";
      default:
        return error.message ?? "Không thể xử lý yêu cầu sự cố lúc này.";
    }
  }

  return "Không thể xử lý yêu cầu sự cố lúc này.";
}
