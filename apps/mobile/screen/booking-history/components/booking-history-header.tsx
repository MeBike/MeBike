import { ScreenHeader } from "@components/ScreenHeader";

type BookingHistoryHeaderProps = {
  topInset?: number;
};

function BookingHistoryHeader({ topInset: _topInset }: BookingHistoryHeaderProps) {
  return (
    <ScreenHeader
      title="Lịch sử thuê xe"
      subtitle="Xem tất cả các lần thuê xe của bạn"
      variant="page"
      showBackButton={false}
    />
  );
}

export default BookingHistoryHeader;
