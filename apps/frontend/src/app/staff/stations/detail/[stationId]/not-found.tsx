// app/stations/[stationId]/not-found.tsx
export default function StationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold">Không tìm thấy trạm này</h2>
      <p>Thông tin trạm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
      <a href="/stations" className="mt-4 text-primary underline">Quay lại danh sách</a>
    </div>
  );
}