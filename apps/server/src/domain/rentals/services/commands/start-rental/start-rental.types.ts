/**
 * Kết quả chuẩn bị cho flow bắt đầu thuê xe.
 *
 * Đây là phần dữ liệu đã được validate và sẵn sàng để bước persistence sử dụng.
 */
export type PreparedStartRental = {
  readonly pricingPolicyId: string;
  readonly requiredBalance: bigint;
};
