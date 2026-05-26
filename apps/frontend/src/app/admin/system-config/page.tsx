"use client";

import React, { useState } from "react";
import { formatToVNTime } from "@/lib/formatVNDate";

import { useSystemConfigActions } from "@/hooks/use-system-config";
import type { SystemConfig } from "@/types/SystemConfig"; 

import { DataTable } from "@/components/TableCustom";
// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Icons
import { 
  Settings2, 
  Edit3, 
  Loader2, 
  Save,
  X
} from "lucide-react";

import { ColumnDef } from "@tanstack/react-table";

interface SystemConfigColumnActions {
  onEdit: (config: SystemConfig) => void;
}

const SYSTEM_CONFIG_KEY_VI: Record<string, string> = {
  "min_available_bikes_at_station": "Số xe khả dụng tối thiểu tại trạm",
  "redistribution_pending_expire_hours": "Thời gian tự động hủy yêu cầu điều phối",
  "min_bikes_for_redistribution_alert": "Số xe tối thiểu để kích hoạt cảnh báo điều phối"
};

export const getSystemConfigColumns = ({ onEdit }: SystemConfigColumnActions): ColumnDef<SystemConfig>[] => {
  return [
    {
      accessorKey: "key",
      header: "Khóa cấu hình (Key)",
      cell: ({ row }) => {
        const key = row.original.key;
        const formatKeyName = (k: string) => {
          if (SYSTEM_CONFIG_KEY_VI[k]) return SYSTEM_CONFIG_KEY_VI[k];
          return k.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
        };

        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{formatKeyName(key)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "value",
      header: "Giá trị hiện tại",
      cell: ({ row }) => {
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold bg-blue-50 text-blue-700 border border-blue-100">
            {row.original.value}
          </span>
        )
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật lần cuối",
      cell: ({ row }) => (
        <span className="text-slate-500 text-sm">
          {formatToVNTime(row.original.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Thao tác</div>,
      cell: ({ row }) => {
        const config = row.original;
        return (
          <div className="text-right">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200"
              onClick={() => onEdit(config)}
            >
              <Edit3 className="h-4 w-4 mr-1.5" />
              Chỉnh sửa
            </Button>
          </div>
        );
      },
    },
  ];
};

export default function SystemConfigPage() {
  const { 
    systemConfigs, 
    isLoading, 
    updateSystemConfig, 
    updateSystemConfigMutation 
  } = useSystemConfigActions({ hasToken : true, key: "system-configs" });

  const getConfigsArray = (raw: any): SystemConfig[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.data)) return raw.data;
    if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
    return [];
  };

  const configsList = getConfigsArray(systemConfigs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<SystemConfig | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");

  const isUpdating = updateSystemConfigMutation.isPending;

  // Lấy giá trị thời gian quy định từ mảng cấu hình (Mặc định 23 nếu không tìm thấy)
  const expireConfig = configsList.find(c => c.key === "redistribution_pending_expire_hours");
  const expireTimeStr = expireConfig?.value || "23:00";
  const allowedHour = parseInt(expireTimeStr.split(":")[0] || expireTimeStr, 10);
  const isSelectedTimeConfig = selectedConfig?.key.includes("hours") || selectedConfig?.key.includes("time");


  const handleEditClick = (config: SystemConfig) => {
    setSelectedConfig(config);
    
    const isTime = config.key.includes("hours") || config.key.includes("time");
    
    if (isTime && config.value) {
      let val = config.value;
      // Trải nghiệm mượt hơn: Nếu API lỡ trả về "9" thì gán lại "09:00" để input nhận được, nếu trả "09:00" thì giữ nguyên
      if (!val.includes(":")) {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          const hh = Math.floor(numVal);
          val = `${String(hh).padStart(2, '0')}:00`;
        }
      }
      setEditValue(val);
    } else {
      setEditValue(config.value);
    }

    setErrorText("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedConfig) return;
    
    const now = new Date();
    const currentHour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "numeric",
        hour12: false,
      }).format(now)
    );
    // CHẶN BẰNG GIÁ TRỊ ĐỘNG
    if (currentHour !== allowedHour) {
      setErrorText(`Hệ thống chỉ cho phép cập nhật cấu hình vào đúng khung giờ ${allowedHour}:00 - ${allowedHour}:59 (UTC+7).`);
      return;
    }

    let finalValue = editValue;

    if (isSelectedTimeConfig) {
      if (!editValue || editValue.trim() === "") {
        setErrorText("Vui lòng chọn thời gian hợp lệ.");
        return;
      }
      // Vì API bây giờ đã trả "09:00", ta không cần parse về "9" nữa. Gửi nguyên giá trị text này lên.
      finalValue = editValue; 
    } else {
      const numericValue = Number(editValue);
      if (isNaN(numericValue) || editValue.trim() === "" || numericValue < 0) {
        setErrorText("Vui lòng nhập một số hợp lệ (lớn hơn hoặc bằng 0).");
        return;
      }
      finalValue = String(numericValue);
    }

    try {
      await updateSystemConfig({
        key: selectedConfig.key,
        data: { value: finalValue },
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
            <Settings2 className="h-6 w-6" />
          </div>
          Cấu hình hệ thống
        </h1>
        <p className="text-slate-500 mt-1">
          Quản lý và điều chỉnh các tham số, chính sách hoạt động cốt lõi của hệ thống.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
             <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
             <p>Đang tải cấu hình...</p>
          </div>
        ) : (
          <DataTable
            title="Danh sách tham số hệ thống"
            tableClassName="table-fixed"
            columns={getSystemConfigColumns({
              onEdit: handleEditClick,
            })}
            data={configsList}
          />
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Cập nhật cấu hình
            </DialogTitle>
            <DialogDescription>
              Hệ thống chỉ chấp nhận lưu thay đổi trong khung giờ {allowedHour}:00 đến {allowedHour}:59 (theo giờ Việt Nam).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider">Khóa tham số</Label>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono font-bold text-slate-700">
                {SYSTEM_CONFIG_KEY_VI[selectedConfig?.key as keyof typeof SYSTEM_CONFIG_KEY_VI] || selectedConfig?.key}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="config-value" className="text-slate-700 font-bold">
                {isSelectedTimeConfig ? "Giá trị thời gian" : "Giá trị cấu hình (Số lượng)"} <span className="text-rose-500">*</span>
              </Label>
              
              <Input
                id="config-value"
                type={isSelectedTimeConfig ? "time" : "number"}
                min={!isSelectedTimeConfig ? "0" : undefined}
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  if (errorText) setErrorText("");
                }}
                placeholder={isSelectedTimeConfig ? "--:--" : "Nhập số lượng..."}
                className={`rounded-xl focus-visible:ring-blue-500 ${errorText ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
                disabled={isUpdating}
              />
              {errorText && (
                <p className="text-xs font-medium text-rose-500 mt-1">{errorText}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isUpdating}
              className="rounded-xl"
            >
              <X className="h-4 w-4 mr-2" />
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}