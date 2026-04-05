import type { RentalDetail } from "@/types/rental-types";

import { StaffDetailField } from "./staff-detail-field";
import { StaffSectionCard } from "./staff-section-card";

type StaffCustomerCardProps = {
  booking: RentalDetail;
};

export function StaffCustomerCard({ booking }: StaffCustomerCardProps) {
  return (
    <StaffSectionCard iconName="person.fill" title="Thông tin khách hàng">
      <StaffDetailField label="Họ tên" value={booking.user.fullname} />
      <StaffDetailField label="Số điện thoại" value={booking.user.phoneNumber} />
      <StaffDetailField label="Email" value={booking.user.email} multiline />
      <StaffDetailField label="Username" value={booking.user.username} />
      <StaffDetailField label="Địa chỉ" value={booking.user.location} />
      <StaffDetailField label="Xác thực" value={booking.user.verify} withSeparator={false} />
    </StaffSectionCard>
  );
}
