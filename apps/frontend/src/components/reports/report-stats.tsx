"use client";

import { Card } from "@/components/ui/card";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { ReportOverview } from "@/types";

interface ReportStatsProps {
  reports: ReportOverview;
}

export function ReportStats({ reports }: ReportStatsProps) {


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tổng báo cáo</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {reports.totalReport || 0}
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
              {reports.totalPendingReport || 0}
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
            <p className="text-sm text-muted-foreground">Đang xử lý</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              {reports.totalInProgressReport || 0}
            </p>
          </div>
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
            <p className="text-3xl font-bold text-blue-500 mt-1">
              {reports.totalCompleteReport || 0}
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <CheckCircle className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}