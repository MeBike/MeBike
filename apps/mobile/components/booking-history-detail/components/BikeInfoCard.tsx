import React from "react";
import InfoCard from "./InfoCard";
import InfoRow from "./InfoRow";
import { RentalDetail } from "../../../types/RentalTypes";

type Props = {
  booking: RentalDetail;
};

const BikeInfoCard = ({ booking }: Props) => {
  return (
    <InfoCard title="Thông tin xe" icon="bicycle">
      <InfoRow
        label="Mã xe:"
        value={
          typeof booking.bike === "object"
            ? booking.bike._id
            : booking.bike || "Không có dữ liệu"
        }
      />
      <InfoRow
        label="Trạm bắt đầu:"
        value={
          typeof booking.start_station === "object"
            ? booking.start_station.name
            : booking.start_station || "Không có dữ liệu"
        }
      />
      {booking.end_station === null ? (
        <InfoRow label="Trạm kết thúc:" value="Xe chưa được trả" />
      ) : typeof booking.end_station === "object" &&
        booking.end_station.name ? (
        <>
          <InfoRow
            label="Trạm kết thúc:"
            value={booking.end_station.name}
          />
          <InfoRow
            label="Địa chỉ kết thúc:"
            value={booking.end_station.address}
          />
        </>
      ) : (
        <InfoRow
          label="Trạm kết thúc:"
          value={
            typeof booking.end_station === "string"
              ? booking.end_station
              : "Không có dữ liệu"
          }
        />
      )}
    </InfoCard>
  );
};

export default BikeInfoCard;
