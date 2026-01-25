import type { Bike } from "../../types/BikeTypes";

export type BikeGraphql = {
  id: string;
  chipId: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  station?: {
    id: string;
  } | null;
  supplier?: {
    id: string;
    name?: string | null;
  } | null;
};

export function mapBikeStatus(status?: string | null): Bike["status"] {
  switch (status) {
    case "Available":
      return "CÓ SẴN";
    case "Booked":
      return "ĐANG ĐƯỢC THUÊ";
    case "Broken":
      return "BỊ HỎNG";
    case "Reserved":
      return "ĐÃ ĐẶT TRƯỚC";
    case "Maintained":
      return "ĐANG BẢO TRÌ";
    case "Unavailable":
      return "KHÔNG CÓ SẴN";
    default:
      return "KHÔNG CÓ SẴN";
  }
}

export function toBikeType(bike: BikeGraphql): Bike {
  return {
    _id: bike.id,
    chip_id: bike.chipId,
    station_id: bike.station?.id ?? "",
    supplier_id: bike.supplier?.id ?? null,
    supplier_name: bike.supplier?.name ?? null,
    status: mapBikeStatus(bike.status),
    created_at: bike.createdAt ?? "",
    updated_at: bike.updatedAt ?? "",
    average_rating: undefined,
    total_ratings: undefined,
  };
}
