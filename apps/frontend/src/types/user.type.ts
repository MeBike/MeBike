import type { GraphQLMutationResponse } from "@/types/GraphQL";
export interface UserStats {
  totalUsers: number;
  totalUser: number;
  totalUserUnverfied: number;
  totalStaff: number;
  totalAdmin: number;
  totalSos: number;
}
export type GetUserStatsResponse = GraphQLMutationResponse<"GetUserStats", UserStats>;