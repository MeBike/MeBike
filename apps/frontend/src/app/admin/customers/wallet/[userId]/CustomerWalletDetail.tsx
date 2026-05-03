"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Loader2,
  RefreshCw,
  User,
  Wallet,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getAssetStatusConfig } from "@/columns/nfc-column";
import type { AssetNFCCard, AssetStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatToVNTime } from "@/lib/formatVNDate";
import { PaginationDemo } from "@/components/PaginationCustomer";
import type { DetailUser } from "@/types";
import type { UserWallet } from "@custom-types";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";

type WalletTxRow = {
  id: string;
  type: string;
  status: string;
  description: string;
  amount: number;
  fee: number;
  createdAt: string;
};

const creditTypes = new Set([
  "NẠP TIỀN",
  "HOÀN TIỀN",
  "CỘNG TIỀN",
  "DEPOSIT",
  "REFUND",
  "ADJUSTMENT",
]);

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function parseNum(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function mapRecordToTxRow(t: Record<string, unknown>): WalletTxRow | null {
  const idRaw = t.id ?? t._id;
  const id =
    typeof idRaw === "string"
      ? idRaw
      : idRaw && typeof idRaw === "object" && "$oid" in idRaw
        ? String((idRaw as { $oid: string }).$oid)
        : String(idRaw ?? "");
  if (!id) return null;
  const createdAt =
    (typeof t.createdAt === "string" && t.createdAt) ||
    (typeof t.created_at === "string" && t.created_at) ||
    "";
  const type = typeof t.type === "string" ? t.type : "";
  const status = typeof t.status === "string" ? t.status : "";
  const description = typeof t.description === "string" ? t.description : "";
  return {
    id,
    type,
    status,
    description,
    amount: parseNum(t.amount),
    fee: parseNum(t.fee),
    createdAt,
  };
}

function normalizeTransactionPayload(data: unknown): WalletTxRow[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data
      .map((item) =>
        item && typeof item === "object"
          ? mapRecordToTxRow(item as Record<string, unknown>)
          : null,
      )
      .filter((x): x is WalletTxRow => x !== null);
  }
  if (typeof data === "object" && data !== null && "items" in data) {
    const items = (data as { items: unknown }).items;
    return normalizeTransactionPayload(items);
  }
  return [];
}

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
}

function txTypeIcon(type: string) {
  switch (type) {
    case "NẠP TIỀN":
    case "DEPOSIT":
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
    case "HOÀN TIỀN":
    case "REFUND":
      return <RefreshCw className="h-4 w-4 text-purple-600" />;
    case "CỘNG TIỀN":
    case "ADJUSTMENT":
      return <Zap className="h-4 w-4 text-blue-600" />;
    default:
      return <ArrowUpRight className="h-4 w-4 text-red-600" />;
  }
}

function txTypeBadgeClass(type: string) {
  switch (type) {
    case "NẠP TIỀN":
    case "DEPOSIT":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
    case "RÚT TIỀN":
    case "WithDrawal":
      return "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100";
    case "THANH TOÁN":
    case "PAYMENT":
    case "DECREASE":
    case "TRỪ TIỀN":
      return "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100";
    case "HOÀN TIỀN":
    case "REFUND":
      return "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-100";
    case "ĐẶT TRUỚC":
    case "RESERVATION":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function statusBadgeVariant(
  status: string,
): "success" | "warning" | "destructive" | "secondary" {
  if (status === "THÀNH CÔNG" || status === "SUCCESS") return "success";
  if (status === "ĐANG CHỜ XỬ LÝ" || status === "PENDING") return "warning";
  if (status === "THẤT BẠI" || status === "FAILED") return "destructive";
  return "secondary";
}
type Status = "ACTIVE" | "INACTIVE";

const statusConfig: Record<Status, { label: string; variant: any }> = {
  ACTIVE: {
    label: "Hoạt động",
    variant: "success",
  },
  INACTIVE: {
    label: "Ngưng hoạt động",
    variant: "destructive",
  },
};

const getStatusConfig = (status: Status) =>
  statusConfig[status] || {
    label: "Không xác định",
    variant: "default",
  };
interface CustomerWalletDetailProps {
  user: DetailUser;
  allWallets: UserWallet | undefined;
  manageTransactions:
    | {
        data?: unknown;
        pagination?: {
          currentPage?: number;
          page?: number;
          totalPages?: number;
          totalRecords?: number;
          limit?: number;
        };
      }
    | null
    | undefined;
  isLoadingWallet: boolean;
  isLoadingTransactions: boolean;
  transactionPage: number;
  onTransactionPageChange: (page: number) => void;
  nfcCardsList?: AssetNFCCard[];
  assignNFC?: (data: { nfcId: string; userId: string }) => Promise<void>;
  unassignNFC?: (data: { nfcId: string; userId: string }) => Promise<void>;
  updateStatusNFC?: (data: { nfcId: string; data: { status: AssetStatus } }) => Promise<void>;
  isAssigning?: boolean;
  isUnassigning?: boolean;
  isUpdatingStatus?: boolean;
}

export default function CustomerWalletDetail({
  user,
  allWallets,
  manageTransactions,
  isLoadingWallet,
  isLoadingTransactions,
  transactionPage,
  onTransactionPageChange,
  nfcCardsList = [],
  assignNFC,
  unassignNFC,
  updateStatusNFC,
  isAssigning,
  isUnassigning,
  isUpdatingStatus,
}: CustomerWalletDetailProps) {
  const wallet = allWallets;
  const txRows = normalizeTransactionPayload(manageTransactions?.data);
  const pagination = manageTransactions?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentTxPage =
    pagination?.currentPage ?? pagination?.page ?? transactionPage;

  const [selectedNfcId, setSelectedNfcId] = useState("");
  const userCards = nfcCardsList.filter((c) => c.assigned_user_id === user.id);
  const availableCards = nfcCardsList.filter((c) => c.status === "UNASSIGNED");

  const handleAssignNFC = async () => {
    if (!selectedNfcId || !assignNFC) return;
    try {
      await assignNFC({ nfcId: selectedNfcId, userId: user.id });
      setSelectedNfcId("");
    } catch (error) {
      console.error(error);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const handleUnassignNFC = (cardId: string) => {
    if (!unassignNFC) return;
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận thu hồi thẻ",
      description: "Bạn có chắc chắn muốn thu hồi thẻ NFC này khỏi khách hàng?",
      onConfirm: async () => {
        try {
          await unassignNFC({ nfcId: cardId, userId: user.id });
        } catch (error) {
          console.error(error);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleUpdateCardStatus = (cardId: string, newStatus: AssetStatus) => {
    if (!updateStatusNFC) return;
    const actionName = newStatus === "BLOCKED" ? "khóa tạm thời" : newStatus === "ACTIVE" ? "mở khóa" : "báo mất";
    setConfirmDialog({
      isOpen: true,
      title: "Xác nhận cập nhật trạng thái",
      description: `Bạn có chắc chắn muốn ${actionName} thẻ này?`,
      onConfirm: async () => {
        try {
          await updateStatusNFC({ nfcId: cardId, data: { status: newStatus } });
        } catch (error) {
          console.error(error);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  if (isLoadingTransactions || isLoadingWallet) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <LoadingScreen />
      </div>
    );
  }
  return (
    <div>
      <PageHeader
        title="Wallet & transactions"
        description={`Balance and activity for ${user.fullName}`}
        backLink="/admin/customers"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/customers/detail/${user.id}`}>
              <User className="h-4 w-4 mr-2" />
              Thông tin người dùng
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage
                    src={user.avatar ?? undefined}
                    alt={user.fullName}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-foreground">
                  {user.fullName}
                </h2>
                {user.email && (
                  <p className="text-sm text-muted-foreground break-all">
                    {user.email}
                  </p>
                )}
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <Label className="text-xs text-muted-foreground">ID</Label>
                <p className="text-sm font-mono bg-muted/50 p-2 rounded mt-1 break-all">
                  {user.id}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Quản lý thẻ NFC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
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
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Ví
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[220px]">
            {wallet ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Số dư</Label>
                  <p className="text-2xl font-semibold text-foreground">
                    {formatVnd(parseNum(wallet.balance))}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Tình trạng</Label>
                  <p className="text-sm py-1">
                    <Badge
                      variant={getStatusConfig(wallet.status).variant}
                      className="font-normal"
                    >
                      {getStatusConfig(wallet.status).label}
                    </Badge>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>ID Ví</Label>
                  <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded break-all">
                    {wallet.id}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>ID người dùng</Label>
                  <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded break-all">
                    {wallet.userId}
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Thời gian</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="text-muted-foreground">
                        Thời gian tạo tài khoản:{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        {wallet.createdAt
                          ? formatToVNTime(wallet.createdAt)
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Thời gian tài khoản cập nhật:{" "}
                      </span>
                      <span className="font-medium text-foreground">
                        {wallet.updatedAt
                          ? formatToVNTime(wallet.updatedAt)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-10 gap-2 text-muted-foreground">
                <Wallet className="h-8 w-8" />
                <p className="text-sm">Chưa có ví</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Lịch sử giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[220px]">
            {txRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 gap-2 text-muted-foreground">
                <CreditCard className="h-8 w-8" />
                <p className="text-sm">Chưa có giao dịch</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {txRows.map((tx) => {
                    const isCredit = creditTypes.has(tx.type);
                    return (
                      <div
                        key={tx.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-border rounded-lg hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 bg-muted rounded-lg shrink-0">
                            {txTypeIcon(tx.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground wrap-break-word">
                              {tx.description || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tx.createdAt
                                ? formatToVNTime(tx.createdAt)
                                : "—"}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-normal",
                                  txTypeBadgeClass(tx.type),
                                )}
                              >
                                {tx.type || "Unknown"}
                              </Badge>
                              <Badge variant={statusBadgeVariant(tx.status)}>
                                {tx.status || "—"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p
                            className={cn(
                              "text-lg font-semibold tabular-nums",
                              isCredit ? "text-emerald-600" : "text-red-600",
                            )}
                          >
                            {isCredit ? "+" : "−"}
                            {formatVnd(Math.abs(tx.amount))}
                          </p>
                          {tx.fee > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Fee: {formatVnd(tx.fee)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="pt-6 mt-6 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">
                      Page {currentTxPage} of {totalPages}
                      {pagination?.totalRecords != null
                        ? ` · ${pagination.totalRecords} records`
                        : ""}
                    </p>
                    <PaginationDemo
                      currentPage={currentTxPage}
                      totalPages={totalPages}
                      onPageChange={onTransactionPageChange}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog 
        open={confirmDialog.isOpen} 
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
              Hủy
            </Button>
            <Button onClick={confirmDialog.onConfirm} disabled={isUnassigning || isUpdatingStatus}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
