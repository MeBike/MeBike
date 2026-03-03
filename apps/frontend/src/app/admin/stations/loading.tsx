import { Skeleton } from "@/components/ui/skeleton";

export default function StationManagementSkeleton() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      {/* 1. Header: Tiêu đề và Nút thêm mới */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[280px]" /> {/* Quản lý trạm xe */}
          <Skeleton className="h-4 w-[220px]" /> {/* Quản lý danh sách trạm xe đạp */}
        </div>
        <Skeleton className="h-10 w-[160px] rounded-md" /> {/* Nút Thêm trạm mới */}
      </div>

      {/* 2. Stats Cards: 3 ô thông số */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 border rounded-xl flex justify-between items-center bg-card shadow-sm">
            <div className="space-y-3">
              <Skeleton className="h-4 w-[100px]" /> {/* Nhãn: Total Station... */}
              <Skeleton className="h-8 w-[50px]" />  {/* Số lượng: 0, 3... */}
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" /> {/* Ô Icon bên phải */}
          </div>
        ))}
      </div>

      {/* 3. Khối nội dung chính (Bao gồm Search và Table) */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Skeleton className="h-12 w-full rounded-lg" /> 
          </div>

          {/* Tiêu đề cột Table */}
          <div className="flex items-center justify-between pb-4 border-b px-2">
            <Skeleton className="h-4 w-[25%]" /> {/* Station Detail */}
            <Skeleton className="h-4 w-[10%]" /> {/* Availability */}
            <Skeleton className="h-4 w-[10%]" /> {/* Bike Status */}
            <Skeleton className="h-4 w-[15%]" /> {/* Last Activity */}
            <Skeleton className="h-4 w-[10%]" /> {/* Status */}
            <Skeleton className="h-4 w-[10%]" /> {/* Actions */}
          </div>

          {/* Danh sách các hàng (Rows) */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between py-5 px-2 border-b last:border-0">
              {/* Cột 1: Thông tin trạm (Icon + Tên + Địa chỉ) */}
              <div className="flex items-center gap-3 w-[25%]">
                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" /> 
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-[80%]" />
                  <Skeleton className="h-3 w-[60%]" />
                </div>
              </div>

              {/* Cột 2: Availability (Số + Thanh progress nhỏ) */}
              <div className="w-[10%] space-y-2">
                 <Skeleton className="h-4 w-[40px]" />
                 <Skeleton className="h-1.5 w-[60px] rounded-full" />
              </div>

              {/* Cột 3: Bike Status */}
              <div className="w-[10%]">
                <Skeleton className="h-4 w-[50px]" />
              </div>

              {/* Cột 4: Hoạt động cuối */}
              <div className="w-[15%]">
                <Skeleton className="h-4 w-[120px]" />
              </div>

              {/* Cột 5: Trạng thái (Badge) */}
              <div className="w-[10%]">
                <Skeleton className="h-7 w-[75px] rounded-full" />
              </div>

              {/* Cột 6: Hành động (2 icon nhỏ) */}
              <div className="w-[10%] flex gap-4">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Pagination (Phân trang ở dưới cùng) */}
      <div className="flex justify-center items-center gap-2 pt-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  );
}