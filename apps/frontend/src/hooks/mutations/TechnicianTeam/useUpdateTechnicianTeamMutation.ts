import { useMutation } from "@tanstack/react-query";
import { technicianService } from "@/services/technician.service";
import type { UpdateTechnicianTeamSchema } from "@/schemas/technician-schema";
export const useUpdateTechnicianTeamMutation = () => {
  return useMutation({
    mutationKey: ["update-technician-team"],
    mutationFn: async ({teamId , technicianTeamData}: {teamId : string , technicianTeamData : UpdateTechnicianTeamSchema}) => {
      const response = await technicianService.updateTechnicianTeam(teamId , technicianTeamData);
      return response;
    },
    });
};