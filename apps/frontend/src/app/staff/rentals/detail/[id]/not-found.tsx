import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function RentalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <FileQuestion className="w-16 h-16 text-muted-foreground" />
      <h2 className="text-2xl font-bold">Không tìm thấy đơn thuê này!</h2>
      <p className="text-muted-foreground">Có vẻ như mã đơn thuê không tồn tại hoặc đã bị xóa.</p>
      <Button asChild>
        <Link href="/staff/rentals">Quay lại danh sách</Link>
      </Button>
    </div>
  );
}