"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ListFilter, RotateCcw, Tag } from "lucide-react"; // Thêm icon
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { nfcCardColumns } from "@/columns/nfc-column";
import { TableSkeleton } from "@/components/table-skeleton";
import type { AssetNFCCard, AssetStatus, Pagination } from "@/types";

// Import UI components
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select từ shadcn

interface NFCClientProps {
  data: {
    nfcCards: AssetNFCCard[];
    pagination?: Pagination;
    isLoading: boolean;
    isCreating: boolean;
  };
  filters: {
    statusFilter: AssetStatus | "all";
    page: number;
  };
  actions: {
    setStatusFilter: Dispatch<SetStateAction<AssetStatus | "all">>;
    setPage: Dispatch<SetStateAction<number>>;
    createNFC: (data: { uid: string }) => Promise<void>;
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
      setIsModalOpen(false);
      setUidInput("");
    } catch (error) {
      console.error("Failed to create NFC:", error);
    }
  };

  const isFiltering = statusFilter !== "all";

  const handleResetFilters = () => {
    setStatusFilter("all");
    setPage(1); // Nên reset về trang 1 khi bỏ lọc
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý thẻ NFC</h1>
          <p className="text-muted-foreground mt-1">
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

      {/* Bộ lọc (Filters) UI Mới */}
      <div className="rounded-xl border border-border bg-card shadow-sm transition-all">
        {/* Header Bộ lọc */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold tracking-tight">Bộ lọc tìm kiếm</span>
          </div>
          
          {isFiltering && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Body Bộ lọc */}
        <div className="flex flex-wrap items-center gap-6 p-4">
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3 w-3" />
              Trạng thái
            </label>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val as AssetStatus | "all");
                setPage(1); // Tự động về trang 1 khi đổi bộ lọc
              }}
            >
              <SelectTrigger className="h-9 w-[220px] border-border/60 bg-background/50 text-sm focus:ring-1 focus:ring-primary">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[250px] rounded-lg shadow-xl">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="UNASSIGNED">Chưa gán</SelectItem>
                <SelectItem value="BLOCKED">Đã khóa</SelectItem>
                <SelectItem value="LOST">Báo mất</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Nếu sau này cần thêm bộ lọc khác (Ví dụ: Trạm, Loại) thì cứ copy khối div flex-col ở trên bỏ vào đây */}
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="min-h-[600px]">
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <p>
                Hiển thị trang <span className="font-medium text-foreground">{pagination?.page ?? 1}</span> / <span className="font-medium text-foreground">{pagination?.totalPages ?? 1}</span>
              </p>
            </div>

            <div className="rounded-md border bg-card">
              <DataTable
                columns={nfcCardColumns({
                  onView: ({ id }) => router.push(`/admin/nfc-card/detail/${id}`),
                })}
                data={nfcCards || []}
              />
            </div>
            
            {pagination && pagination.totalPages > 1 && (
              <div className="pt-2">
                <PaginationDemo
                  currentPage={page}
                  onPageChange={setPage}
                  totalPages={pagination.totalPages}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}