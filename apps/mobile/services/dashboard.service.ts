import { http } from "@utils/http";

export type DashboardStats = {
  totalStations: number;
  totalBikes: number;
  totalUsers: number;
};

export const dashboardService = {
  getDashboardStats: async () => {
    const response = await http.get<{
      message: string;
      result: DashboardStats;
    }>("/dashboard/stats");
    return response.data;
  },
};
