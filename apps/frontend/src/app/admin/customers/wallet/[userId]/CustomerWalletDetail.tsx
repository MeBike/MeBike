"use client";

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
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatToVNTime } from "@/lib/formatVNDate";
import { PaginationDemo } from "@/components/PaginationCustomer";
import type { DetailUser } from "@/types";
import type { UserWallet } from "@custom-types";
import { cn } from "@/lib/utils";

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
}

export default function CustomerWalletDetail({
  user,
  allWallets,
  manageTransactions,
  isLoadingWallet,
  isLoadingTransactions,
  transactionPage,
  onTransactionPageChange,
}: CustomerWalletDetailProps) {
  const wallet = allWallets;
  const txRows = normalizeTransactionPayload(manageTransactions?.data);
  const pagination = manageTransactions?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const currentTxPage =
    pagination?.currentPage ?? pagination?.page ?? transactionPage;

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
              User profile
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
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
              <Label className="text-xs text-muted-foreground">
                ID
              </Label>
              <p className="text-sm font-mono bg-muted/50 p-2 rounded mt-1 break-all">
                {user.id}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Ví
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWallet ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : wallet ? (
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
                      variant={
                        wallet.status === "ACTIVE" ? "success" : "default"
                      }
                      className="font-normal"
                    >
                      {wallet.status}
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
                      <span className="text-muted-foreground">Thời gian tạo tài khoản: </span>
                      <span className="font-medium text-foreground">
                        {wallet.createdAt
                          ? formatToVNTime(wallet.createdAt)
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Thời gian tài khoản cập nhật: </span>
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
              <p className="text-sm text-muted-foreground py-8 text-center">
                Chưa có ví
              </p>
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
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : txRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Chưa có giao dịch
              </p>
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
    </div>
  );
}
