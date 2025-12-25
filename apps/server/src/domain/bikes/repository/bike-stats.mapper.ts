import type { BikeRentalHistoryItem } from "../models";

export type RentalHistoryRowRaw = {
  id: string;
  start_time: Date;
  end_time: Date | null;
  duration: number | null;
  total_price: string | null;
  user_id: string;
  fullname: string;
  start_station_id: string;
  start_station_name: string;
  end_station_id: string | null;
  end_station_name: string | null;
  total_records: number;
};

export function toBikeRentalHistoryItem(
  row: RentalHistoryRowRaw,
): BikeRentalHistoryItem {
  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    totalPrice: row.total_price ? Number(row.total_price) : null,
    user: {
      id: row.user_id,
      fullname: row.fullname,
    },
    startStation: {
      id: row.start_station_id,
      name: row.start_station_name,
    },
    ...(row.end_station_id
      ? {
          endStation: {
            id: row.end_station_id,
            name: row.end_station_name ?? "",
          },
        }
      : {}),
  };
}
