import { useMutation } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";
import type { UpdateReportSchemaFormData } from "@/schemas/report-schema";
export function useUpdateReportMutation() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReportSchemaFormData }) =>
      reportService.updateReport(id, data),
  });
}
