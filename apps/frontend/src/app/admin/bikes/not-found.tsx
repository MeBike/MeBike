// app/stations/[stationId]/not-found.tsx
export default function BikeNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold">Không tìm thấy xe này</h2>
      <p>Thông tin xe bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
      <a href="/bikes" className="mt-4 text-primary underline">Quay lại danh sách</a>
    </div>
  );
}