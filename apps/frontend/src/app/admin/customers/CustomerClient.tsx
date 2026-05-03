"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, CreditCard, ShieldAlert } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { CustomerStats } from "@/components/customers/customer-stats";
import { Button } from "@/components/ui/button";
import { userColumns } from "@/columns/user-columns";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { TableSkeleton } from "@/components/table-skeleton";
import { UserFilters } from "./components/customer-filter";
import { getAssetStatusConfig } from "@/columns/nfc-column"; 
import { Badge } from "@/components/ui/badge"; 
import type { DetailUser, Pagination, VerifyStatus, GetUserDashboardStatsResponse } from "@custom-types";
import type { AssetNFCCard, AssetStatus } from "@/types"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type UserStatusFilter = VerifyStatus | "BANNED" | "all";

interface CustomersClientProps {
  data: {
    users: DetailUser[];
    dashboardStatsData?: GetUserDashboardStatsResponse;
    paginationUser?: Pagination;
    isVisualLoading: boolean;
    nfcCardsList: AssetNFCCard[]; 
    isAssigning: boolean;
    isUnassigning: boolean;
    isUpdatingStatus: boolean; // Trạng thái loading
  };
  filters: {
    searchQuery: string;
    verifyFilter: UserStatusFilter;
    currentPage: number;
  };
  actions: {
    setSearchQuery: Dispatch<SetStateAction<string>>;
    setVerifyFilter: Dispatch<SetStateAction<UserStatusFilter>>;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    handleReset: () => void;
    handleFilterChange: () => void;
    assignNFC: (data: { nfcId: string; userId: string }) => Promise<void>;
    unassignNFC: (data: { nfcId: string; userId: string }) => Promise<void>;
    updateStatusNFC: (data: { nfcId: string; data: { status: AssetStatus } }) => Promise<void>; // Hàm update status
  };
}

export default function CustomersClient({
  data: { users, dashboardStatsData, paginationUser, isVisualLoading, nfcCardsList, isAssigning, isUnassigning, isUpdatingStatus },
  filters: { searchQuery, verifyFilter, currentPage },
  actions: {
    setSearchQuery,
    setVerifyFilter,
    setCurrentPage,
    handleReset,
    handleFilterChange,
    assignNFC,
    unassignNFC,
    updateStatusNFC
  },
}: CustomersClientProps) {
  const router = useRouter();

  const [nfcModal, setNfcModal] = useState({ isOpen: false, userId: "", userName: "" });
  const [selectedNfcId, setSelectedNfcId] = useState("");

  const handleDetailUser = (id: string) => router.push(`/admin/customers/detail/${id}`);
  const handleWalletUser = (id: string) => router.push(`/admin/customers/wallet/${id}`);

  const userCards = nfcCardsList.filter((c) => c.assigned_user_id === nfcModal.userId);
  const availableCards = nfcCardsList.filter((c) => c.status === "UNASSIGNED");

  const handleAssignNFC = async () => {
    if (!selectedNfcId) return;
    try {
      await assignNFC({ nfcId: selectedNfcId, userId: nfcModal.userId });
      setSelectedNfcId(""); 
    } catch (error) {
      console.error(error);
    }
  };

  const handleUnassignNFC = async (cardId: string) => {
    if (confirm("Bạn có chắc chắn muốn thu hồi thẻ NFC này khỏi khách hàng?")) {
      try {
        await unassignNFC({ nfcId: cardId, userId: nfcModal.userId });
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Hàm xử lý đổi trạng thái
  const handleUpdateCardStatus = async (cardId: string, newStatus: AssetStatus) => {
    const actionName = newStatus === "BLOCKED" ? "khóa tạm thời" : newStatus === "ACTIVE" ? "mở khóa" : "báo mất";
    if (confirm(`Bạn có chắc chắn muốn ${actionName} thẻ này?`)) {
      try {
        await updateStatusNFC({ nfcId: cardId, data: { status: newStatus } });
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quản lý người dùng</h1>
            <p className="mt-1 text-muted-foreground">Theo dõi và quản lý thông tin người dùng hệ thống</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/admin/customers/create")}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm người dùng
            </Button>
          </div>
        </div>

        {dashboardStatsData && <CustomerStats stats={dashboardStatsData} />}

        <UserFilters
          verifyFilter={verifyFilter}
          setVerifyFilter={setVerifyFilter}
          handleFilterChange={handleFilterChange}
          onReset={() => {
            setSearchQuery("");
            setCurrentPage(1);
          }}
        />

        <div className="min-h-[700px]">
          {isVisualLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Hiển thị {paginationUser?.page ?? 1} / {paginationUser?.totalPages ?? 1} trang
              </p>

              <DataTable
                title="Danh sách người dùng"
                tableClassName="table-fixed"
                columns={userColumns({
                  onView: (user) => handleDetailUser(String(user.id)),
                  onViewWallet: (user) => handleWalletUser(String(user.id)),
                  onAssignNFC: (user) => {
                    setNfcModal({
                      isOpen: true,
                      userId: String(user.id),
                      userName: user.name || "Khách hàng",
                    });
                  },
                })}
                data={users}
                searchValue={searchQuery}
                filterPlaceholder="Tìm kiếm người dùng"
                onSearchChange={setSearchQuery}
              />

              <div className="pt-3">
                <PaginationDemo
                  currentPage={currentPage}
                  totalPages={paginationUser?.totalPages ?? 1}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Quản lý thẻ NFC */}
      <Dialog 
        open={nfcModal.isOpen} 
        onOpenChange={(open) => {
          setNfcModal((prev) => ({ ...prev, isOpen: open }));
          if (!open) setSelectedNfcId("");
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quản lý thẻ NFC</DialogTitle>
            <DialogDescription>
              Khách hàng: <strong className="text-slate-800">{nfcModal.userName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-6">
            
            {/* Mục 1: Thẻ đang sở hữu */}
            <div className="space-y-3">
              <Label className="font-semibold text-slate-700 block">Thẻ đang sở hữu</Label>
              {userCards.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {userCards.map((card) => {
                    const statusConfig = getAssetStatusConfig(card.status);
                    return (
                      <div key={card.id} className="flex flex-col p-3 border rounded-md bg-slate-50 gap-3">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold font-mono text-slate-800 flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5" /> {card.uid}
                            </span>
                            <span className="text-xs text-muted-foreground mt-0.5">ID: {card.id.substring(0, 8)}...</span>
                          </div>
                          <Badge className={`${statusConfig.color} px-2 py-0.5 text-[10px]`} variant="outline">
                            {statusConfig.label}
                          </Badge>
                        </div>
                        
                        {/* Hàng chứa các action cho thẻ */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 border-dashed">
                          {card.status === "ACTIVE" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs px-2 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700" 
                                onClick={() => handleUpdateCardStatus(card.id, "BLOCKED")} 
                                disabled={isUpdatingStatus}
                              >
                                Khóa
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-7 text-xs px-2" 
                                onClick={() => handleUpdateCardStatus(card.id, "LOST")} 
                                disabled={isUpdatingStatus}
                              >
                                Báo mất
                              </Button>
                            </>
                          )}
                          {card.status === "BLOCKED" && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="h-7 text-xs px-2 bg-green-600 hover:bg-green-700" 
                              onClick={() => handleUpdateCardStatus(card.id, "ACTIVE")} 
                              disabled={isUpdatingStatus}
                            >
                              Mở khóa
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleUnassignNFC(card.id)}
                            disabled={isUnassigning || isUpdatingStatus}
                          >
                            Thu hồi
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic bg-slate-50 p-3 rounded-md border border-dashed text-center">
                  Khách hàng này chưa có thẻ NFC nào.
                </div>
              )}
            </div>

            {/* Mục 2: Gán thẻ mới */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Label htmlFor="nfcSelect" className="font-semibold text-slate-700 block">Gán thẻ mới</Label>
              <div className="flex gap-2">
                <select
                  id="nfcSelect"
                  value={selectedNfcId}
                  onChange={(e) => setSelectedNfcId(e.target.value)}
                  disabled={isAssigning || availableCards.length === 0}
                  className="flex h-10 w-full flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    {availableCards.length > 0 ? "-- Chọn thẻ NFC từ kho --" : "Không có thẻ NFC nào đang trống"}
                  </option>
                  {availableCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      UID: {card.uid} (ID: {card.id.substring(0, 6)}...)
                    </option>
                  ))}
                </select>

                <Button 
                  onClick={handleAssignNFC} 
                  disabled={!selectedNfcId || isAssigning}
                  className="shrink-0"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gán thẻ"}
                </Button>
              </div>
              {availableCards.length === 0 && (
                <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                  <ShieldAlert className="w-3 h-3" /> Hãy tạo thêm thẻ NFC ở trang Quản lý NFC.
                </p>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}