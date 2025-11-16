import React from "react";
import InfoCard from "./InfoCard";
import InfoRow from "./InfoRow";
import { RentalDetail } from "../../../types/RentalTypes";
import { formatVietnamDateTime } from "../../../utils/date";

type Props = {
  booking: RentalDetail;
};

const formatDate = (dateString: string) =>
  formatVietnamDateTime(dateString, { includeSeconds: true });

const UserInfoCard = ({ booking }: Props) => {
  return (
    <InfoCard title="Thông tin người dùng" icon="person">
      <InfoRow
        label="Họ tên:"
        value={booking.user?.fullname || "Không có dữ liệu"}
      />
      <InfoRow
        label="Username:"
        value={booking.user?.username || "Không có dữ liệu"}
      />
      <InfoRow
        label="Email:"
        value={booking.user?.email || "Không có dữ liệu"}
      />
      <InfoRow
        label="Số điện thoại:"
        value={booking.user?.phone_number || "Không có dữ liệu"}
      />
      <InfoRow
        label="Địa chỉ:"
        value={booking.user?.location || "Không có dữ liệu"}
      />
      <InfoRow
        label="Trạng thái xác thực:"
        value={booking.user?.verify || "Không có dữ liệu"}
      />
      <InfoRow label="Role:" value={booking.user?.role || "Không có dữ liệu"} />
      <InfoRow
        label="Ngày tạo tài khoản:"
        value={
          booking.user?.created_at
            ? formatDate(booking.user.created_at)
            : "Không có dữ liệu"
        }
      />
    </InfoCard>
  );
};

export default UserInfoCard;
