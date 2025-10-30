import { useMutation } from "@tanstack/react-query";

import { reportService } from "@services/report.service";
import type { CreateReportData } from "@services/report.service";

export function useCreateReport() {
  return useMutation({
    mutationKey: ["reports", "create"],
    mutationFn: (data: CreateReportData) => reportService.createReport(data),
  });
}