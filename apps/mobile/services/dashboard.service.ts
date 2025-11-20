import { http } from "@utils/http";

export type DashboardStats = {
  totalStations: number;
  totalBikes: number;
  totalUsers: number;
  appRating: {
    average_rating: number;
    total_ratings: number;
    five_star_count: number;
    four_star_count: number;
    three_star_count: number;
    two_star_count: number;
    one_star_count: number;
  };
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
