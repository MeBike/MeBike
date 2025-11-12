import type { Pagination } from "./Pagination";

export type FixedSlotStatus =
  | "ĐANG HOẠT ĐỘNG"
  | "TẠM DỪNG"
  | "ĐÃ HUỶ";

export type FixedSlotTemplate = {
  _id: string;
  user_id: string;
  station_id: string;
  slot_start: string;
  selected_dates: string[];
  status: FixedSlotStatus;
  created_at?: string;
  updated_at?: string;
};

export type FixedSlotTemplateListItem = {
  _id: string;
  slot_start: string;
  selected_dates: string[];
  status: FixedSlotStatus;
  station_name?: string;
  created_at?: string;
  user?: {
    fullname?: string;
    email?: string;
  };
};

export type FixedSlotTemplateDetail = FixedSlotTemplate & {
  station_name?: string;
  user?: {
    fullname?: string;
    email?: string;
  };
};

export type FixedSlotTemplateListResponse = {
  data: FixedSlotTemplateListItem[];
  pagination: Pagination;
};

export type FixedSlotTemplateListParams = {
  page?: number;
  limit?: number;
  status?: FixedSlotStatus;
  station_id?: string;
};

export type CreateFixedSlotTemplatePayload = {
  station_id: string;
  slot_start: string;
  selected_dates: string[];
};

export type UpdateFixedSlotTemplatePayload = Partial<{
  slot_start: string;
  selected_dates: string[];
}>;
