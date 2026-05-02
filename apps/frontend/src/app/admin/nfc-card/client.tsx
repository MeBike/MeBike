"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { nfcCardColumns } from "@/columns/nfc-column";
import { TableSkeleton } from "@/components/table-skeleton";
import type { AssetNFCCard, AssetStatus, Pagination } from "@/types";

// Import các component Modal/Dialog từ thư viện UI (ví dụ shadcn/ui)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NFCClientProps {
  data: {
    nfcCards: AssetNFCCard[];
    pagination?: Pagination;
    isLoading: boolean;
    isCreating: boolean; // Thêm state loading khi tạo
  };
  filters: {
    statusFilter: AssetStatus | "all";
    page: number;
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<AssetStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
    createNFC: (data: { uid: string }) => Promise<void>; // Thêm action gọi API tạo thẻ
  };
}

export default function NFCClient({
  data: { nfcCards, pagination, isLoading, isCreating },
  filters: { statusFilter, page },
  actions: { setStatusFilter, setPage, createNFC },
}: NFCClientProps) {
  const router = useRouter();

  // State quản lý Modal tạo thẻ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uidInput, setUidInput] = useState("");

  const handleCreateCard = async () => {
    if (!uidInput.trim()) return;
    try {
      await createNFC({ uid: uidInput.trim() });
      // Nếu thành công thì đóng modal và reset input
      setIsModalOpen(false);
      setUidInput("");
    } catch (error) {
      // Bắt lỗi nếu cần, hoặc hook đã tự handle toast error
      console.error("Failed to create NFC:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý thẻ NFC</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách thẻ, trạng thái và thông tin người sở hữu.
          </p>
        </div>

        {/* Nút mở Modal Create */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tạo thẻ NFC
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tạo thẻ NFC mới</DialogTitle>
              <DialogDescription>
                Nhập mã UID của thẻ vật lý để đăng ký vào hệ thống.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="uid" className="text-right">
                  Mã UID
                </Label>
                <Input
                  id="uid"
                  placeholder="Ví dụ: 04 8B ... "
                  className="col-span-3"
                  value={uidInput}
                  onChange={(e) => setUidInput(e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating}
              >
                Hủy
              </Button>
              <Button 
                onClick={handleCreateCard} 
                disabled={isCreating || !uidInput.trim()}
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Xác nhận
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bộ lọc (Filters) */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AssetStatus | "all")}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="UNASSIGNED">Chưa gán</option>
          <option value="BLOCKED">Đã khóa</option>
          <option value="LOST">Báo mất</option>
        </select>
      </div>

      {/* Bảng dữ liệu */}
      <div className="min-h-[600px]">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Hiển thị trang {pagination?.page ?? 1} / {pagination?.totalPages ?? 1}
            </p>

            <DataTable
              columns={nfcCardColumns({
                onView: ({ id }) => router.push(`/admin/nfc-cards/detail/${id}`),
              })}
              data={nfcCards || []}
            />
            
            {pagination && pagination.totalPages > 1 && (
              <div className="pt-3">
                <PaginationDemo
                  currentPage={page}
                  onPageChange={setPage}
                  totalPages={pagination.totalPages}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}