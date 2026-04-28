import { useMutation } from "@tanstack/react-query";
import { technicianService } from "@/services/technician.service";
import { CreateTechnicianTeamSchema } from "@/schemas/technician-schema";
export const useCreateTechnicianTeamMutation = () => {
  return useMutation({
    mutationKey: ["create-technician-team"],
    mutationFn: async (technicianTeamData: CreateTechnicianTeamSchema) => {
      const response = await technicianService.createTechnicianTeam(technicianTeamData);
      return response;
    },
    });
};