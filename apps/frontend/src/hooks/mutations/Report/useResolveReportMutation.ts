import { useMutation } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";
import type { ResolveReportSchemaFormData } from "@/schemas/reportSchema";
export function useResolveReportMutation(){
    return useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id: string;
        data: ResolveReportSchemaFormData;
      }) => reportService.resolveReport({ id, data }),
    })
}