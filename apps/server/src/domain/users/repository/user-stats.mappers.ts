import type { TopRenterRow, VipCustomer } from "../models";

export type TopRenterRowRaw = {
  user_id: string;
  total_rentals: number;
  fullname: string;
  email: string;
  avatar: string | null;
  phone_number: string | null;
  location: string | null;
  total_records: number;
};

export type VipCustomerRowRaw = {
  user_id: string;
  fullname: string;
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
      fullname: row.fullname,
      email: row.email,
      avatar: row.avatar,
      phoneNumber: row.phone_number,
      location: row.location,
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
        fullname: rows[0].fullname,
        totalDuration: Number(rows[0].total_duration),
      }
    : null;
}
