export type Report = {
  _id: string;
  user_id: string;
  bike_id: string;
  station_id: string;
  rental_id: string;
  assignee_id: string | null;
  media_urls: string[];
  location?: string;
  priority: ReportPriority;
  longtitude?: number;
  latitude?: number;
  type: string;
  message: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
};
export type ReportOverview = {
  totalCompleteReport: number;
  totalReport: number;
  totalInProgressReport: number;
  totalCancelReport: number;
  totalPendingReport: number;
};
export enum ReportStatus {
  Pending = "ĐANG CHỜ XỬ LÝ",
  InProgress = "ĐANG XỬ LÝ",
  Resolved = "ĐÃ GIẢI QUYẾT",
  Cancel = "ĐÃ HỦY",
}
export enum ReportPriority {
  LOW = "THẤP",
  NORMAL = "BÌNH THƯỜNG",
  HIGH = "CAO",
  URGENT = "KHẨN CẤP",
}