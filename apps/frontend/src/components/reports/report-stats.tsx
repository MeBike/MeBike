"use client";

import { Card } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import type { Report } from "@/services/report.service";

interface ReportStatsProps {
  reports: Report[];
}

export function ReportStats({ reports }: ReportStatsProps) {
  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === "PENDING").length;
  const resolvedReports = reports.filter(r => r.status === "RESOLVED").length;
  const urgentReports = reports.filter(r => r.priority === "HIGH").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tổng báo cáo</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {totalReports}
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <FileText className="w-6 h-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Đang chờ xử lý</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">
              {pendingReports}
            </p>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Đã giải quyết</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {resolvedReports}
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Ưu tiên cao</p>
            <p className="text-3xl font-bold text-red-500 mt-1">
              {urgentReports}
            </p>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}