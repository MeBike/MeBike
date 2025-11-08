import { useMutation } from "@tanstack/react-query";
import {ConfirmSOSSchema } from "@/schemas/sosSchema";
import { sosService } from "@/services/sos.service";
export const useConfirmSOSRequestMutation = () => {
  return useMutation({
    mutationFn: ({id , data} : {id : string , data : ConfirmSOSSchema}) =>
        sosService.postConfirmSOSRequest({ id , data }),
  });
};
