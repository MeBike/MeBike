export type Bike = {
  _id: string;
  station_id: string;
  status:
    | "CÓ SẴN"
    | "ĐANG ĐƯỢC THUÊ"
    | "BỊ HỎNG"
    | "ĐÃ ĐẶT TRƯỚC"
    | "ĐANG BẢO TRÌ"
    | "KHÔNG CÓ SẴN";
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
  chip_id: string;
};
