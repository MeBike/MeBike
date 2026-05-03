"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, User, ShieldAlert, Key, Calendar, Loader2, Fingerprint, Mail, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatToVNTime } from "@/lib/formatVNDate";
import { getAssetStatusConfig } from "@/columns/nfc-column";
import type { AssetNFCCard, AssetStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NFCDetailClientProps {
  data: {
    nfcCardDetail?: AssetNFCCard;
    isLoading: boolean;
  };
  actions: {
    assignNFC: (data: { nfcId: string; userId: string }) => Promise<void>;
    unassignNFC: (data: { nfcId: string; userId: string }) => Promise<void>;
    updateStatusNFC: (data: { nfcId: string; data: { status: AssetStatus } }) => Promise<void>;
    isAssigning: boolean;
    isUnassigning: boolean;
    isUpdatingStatus: boolean;
  };
}

export default function NFCDetailClient({ data: { nfcCardDetail, isLoading }, actions }: NFCDetailClientProps) {
  const router = useRouter();
  
  // State quản lý Modal Gán User
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [userIdInput, setUserIdInput] = useState("");

  // State quản lý Modal Xác nhận (dùng chung cho Hủy gán & Đổi trạng thái)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: async () => {},
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu thẻ...</p>
      </div>
    );
  }

  if (!nfcCardDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <CreditCard className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-xl font-semibold">Không tìm thấy thẻ NFC</h2>
        <p className="text-muted-foreground mt-2">Thẻ này không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
        <Button variant="outline" className="mt-6" onClick={() => router.back()}>Quay lại danh sách</Button>
      </div>
    );
  }

  const { status, uid, assigned_user, created_at, issued_at, blocked_at, lost_at, id } = nfcCardDetail;
  const statusConfig = getAssetStatusConfig(status);

  // Xử lý gán thẻ
  const handleAssign = async () => {
    if (!userIdInput.trim()) return;
    try {
      await actions.assignNFC({ nfcId: id, userId: userIdInput.trim() });
      setAssignModalOpen(false);
      setUserIdInput("");
    } catch (error) {
      console.error(error);
    }
  };

  // Mở Dialog Xác nhận Hủy gán
  const triggerUnassign = () => {
    if (!assigned_user?.id) return;
    setConfirmDialog({
      isOpen: true,
      title: "Thu hồi thẻ (Hủy gán)",
      description: "Bạn có chắc chắn muốn thu hồi thẻ này khỏi người dùng? Khách hàng sẽ không thể dùng thẻ này để mở khóa xe nữa.",
      isDestructive: true,
      onConfirm: async () => {
        await actions.unassignNFC({ nfcId: id, userId: assigned_user.id });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Mở Dialog Xác nhận Đổi trạng thái
  const triggerUpdateStatus = (newStatus: AssetStatus) => {
    const actionName = newStatus === "BLOCKED" ? "Khóa tạm thời" : newStatus === "ACTIVE" ? "Mở khóa" : "Báo mất";
    const isDestructive = newStatus === "LOST";

    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận ${actionName.toLowerCase()} thẻ`,
      description: `Bạn có chắc chắn muốn ${actionName.toLowerCase()} thẻ này? Cập nhật trạng thái có thể ảnh hưởng đến quá trình sử dụng của khách hàng.`,
      isDestructive,
      onConfirm: async () => {
        await actions.updateStatusNFC({ nfcId: id, data: { status: newStatus } });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Helper để lấy 2 chữ cái đầu làm Avatar
  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-background p-1 rounded-xl">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="shrink-0 rounded-full hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Chi tiết thẻ NFC</h1>
            <Badge className={`${statusConfig.color} px-3 py-1 text-sm shadow-sm border`} variant="outline">
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm font-mono mt-1.5 flex items-center gap-1.5">
            <Fingerprint className="w-3.5 h-3.5" /> ID: {id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Thông tin thẻ vật lý */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" /> Nhận diện thẻ
            </CardTitle>
            <CardDescription>Thông số vật lý và lịch sử trạng thái của thẻ</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex flex-col flex-1">
            <div className="p-5 space-y-4 flex-1">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 flex items-center gap-2 text-sm font-medium">
                  <Key className="w-4 h-4 text-slate-400"/> Mã thẻ (UID)
                </span>
                <span className="font-mono font-bold text-lg text-slate-800 tracking-wider">{uid}</span>
              </div>
              
              <div className="flex justify-between items-center px-3 py-2 border-b border-slate-100 border-dashed">
                <span className="text-slate-500 flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4"/> Ngày tạo hệ thống
                </span>
                <span className="text-sm font-medium text-slate-700">{created_at ? formatToVNTime(created_at) : "-"}</span>
              </div>

              {blocked_at && (
                <div className="flex justify-between items-center px-3 py-2 border-b border-slate-100 border-dashed bg-orange-50/50 rounded-md">
                  <span className="flex items-center gap-2 text-orange-600 text-sm font-medium">
                    <ShieldAlert className="w-4 h-4"/> Bị khóa lúc
                  </span>
                  <span className="text-sm font-semibold text-orange-700">{formatToVNTime(blocked_at)}</span>
                </div>
              )}

              {lost_at && (
                <div className="flex justify-between items-center px-3 py-2 border-b border-slate-100 border-dashed bg-red-50/50 rounded-md">
                  <span className="flex items-center gap-2 text-red-600 text-sm font-medium">
                    <ShieldAlert className="w-4 h-4"/> Báo mất lúc
                  </span>
                  <span className="text-sm font-semibold text-red-700">{formatToVNTime(lost_at)}</span>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 mt-auto">
              <div className="grid grid-cols-2 gap-3">
                {status === "ACTIVE" && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full bg-white border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 shadow-sm" 
                      onClick={() => triggerUpdateStatus("BLOCKED")} 
                      disabled={actions.isUpdatingStatus}
                    >
                      {actions.isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : "Khóa tạm thời"}
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full shadow-sm" 
                      onClick={() => triggerUpdateStatus("LOST")} 
                      disabled={actions.isUpdatingStatus}
                    >
                      Báo mất thẻ
                    </Button>
                  </>
                )}
                {status === "BLOCKED" && (
                  <Button 
                    variant="default" 
                    className="w-full col-span-2 shadow-sm bg-green-600 hover:bg-green-700" 
                    onClick={() => triggerUpdateStatus("ACTIVE")} 
                    disabled={actions.isUpdatingStatus}
                  >
                    Mở khóa thẻ
                  </Button>
                )}
                {(status === "UNASSIGNED" || status === "LOST") && (
                   <div className="col-span-2 text-center text-sm text-muted-foreground italic py-2">
                     Không có hành động khả dụng cho trạng thái này.
                   </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Thông tin chủ sở hữu */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" /> Chủ sở hữu
            </CardTitle>
            <CardDescription>Thông tin tài khoản đang được gán với thẻ này</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex flex-col flex-1">
            {assigned_user ? (
              <>
                <div className="p-6 space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl shadow-inner border border-emerald-200">
                      {getInitials(assigned_user.fullname)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{assigned_user.fullname}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5" /> {assigned_user.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Trạng thái ví</p>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">{assigned_user.account_status}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Xác thực KYC</p>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">{assigned_user.verify_status}</Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-t border-slate-100">
                    <span className="text-sm text-slate-500 font-medium">Thời điểm cấp thẻ:</span>
                    <span className="text-sm font-semibold text-slate-700">{issued_at ? formatToVNTime(issued_at) : "-"}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 bg-slate-50 border-t border-slate-100 mt-auto">
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-sm transition-all" 
                    onClick={triggerUnassign} 
                    disabled={actions.isUnassigning}
                  >
                    {actions.isUnassigning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
                    Thu hồi thẻ (Hủy gán)
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center flex-1">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">Chưa có chủ sở hữu</h3>
                <p className="text-sm text-slate-500 max-w-xs mb-6">
                  Thẻ NFC này hiện đang trống. Gán thẻ cho khách hàng để họ có thể chạm mở khóa xe.
                </p>
                <Button 
                  onClick={() => setAssignModalOpen(true)} 
                  disabled={status === "LOST" || status === "BLOCKED"}
                  className="shadow-md"
                >
                  <Key className="w-4 h-4 mr-2" /> Gán thẻ cho người dùng
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. Modal Gán User */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gán thẻ cho khách hàng</DialogTitle>
            <DialogDescription>
              Nhập User ID của khách hàng để liên kết với mã thẻ vật lý <strong className="text-slate-800">{uid}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="userId" className="mb-2 block font-semibold text-slate-700">User ID khách hàng</Label>
            <Input
              id="userId"
              placeholder="Nhập ID (VD: c3b91a...)"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              disabled={actions.isAssigning}
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)} disabled={actions.isAssigning}>Hủy</Button>
            <Button onClick={handleAssign} disabled={!userIdInput.trim() || actions.isAssigning}>
              {actions.isAssigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xác nhận gán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Modal Xác Nhận Dùng Chung (Hủy gán / Đổi trạng thái) */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className={confirmDialog.isDestructive ? "text-red-600 flex items-center gap-2" : "flex items-center gap-2"}>
              {confirmDialog.isDestructive && <AlertTriangle className="w-5 h-5" />}
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))} 
              disabled={actions.isUnassigning || actions.isUpdatingStatus}
            >
              Hủy
            </Button>
            <Button 
              variant={confirmDialog.isDestructive ? "destructive" : "default"} 
              onClick={confirmDialog.onConfirm} 
              disabled={actions.isUnassigning || actions.isUpdatingStatus}
            >
              {(actions.isUnassigning || actions.isUpdatingStatus) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}