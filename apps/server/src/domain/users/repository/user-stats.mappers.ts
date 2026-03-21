import type { TopRenterRow, VipCustomer } from "../models";

export type TopRenterRowRaw = {
  user_id: string;
  total_rentals: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone_number: string | null;
  location_text: string | null;
  total_records: number;
};

export type VipCustomerRowRaw = {
  user_id: string;
  full_name: string;
  total_duration: number;
};

export function mapTopRenterRows(
  rows: readonly TopRenterRowRaw[],
): { items: TopRenterRow[]; totalRecords: number } {
  const totalRecords = rows.length > 0 ? Number(rows[0].total_records) : 0;
  const items: TopRenterRow[] = rows.map(row => ({
    totalRentals: Number(row.total_rentals),
    user: {
      id: row.user_id,
      fullName: row.full_name,
      email: row.email,
      avatar: row.avatar_url,
      phoneNumber: row.phone_number,
      location: row.location_text,
    },
  }));

  return { items, totalRecords };
}

export function selectVipCustomer(
  rows: readonly VipCustomerRowRaw[],
): VipCustomer {
  return rows.length > 0
    ? {
        userId: rows[0].user_id,
        fullName: rows[0].full_name,
        totalDuration: Number(rows[0].total_duration),
      }
    : null;
}
