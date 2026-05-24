import { useMutation } from "@tanstack/react-query";
import { configService } from "@/services/config.service";
export const useUpdateSystemConfigMutation = () => {  
    return useMutation({
      mutationFn: ({
        key,
        value,
      }: {
        key: string;
        value: string;
      }) => configService.updateSystemConfig(key, { value }),
    });
}