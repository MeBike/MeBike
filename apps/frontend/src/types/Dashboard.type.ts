
export interface DashboardStats {
  totalStations: number;
  totalBikes: number;
  totalUsers: number;
//   appRating: {
//     average_rating: number;
//     total_ratings: number;
//     five_star_count: number;
//     four_star_count: number;
//     three_star_count: number;
//     two_star_count: number;
//     one_star_count: number;
//   };
}

export interface StationData {
  name: string;
  address: string;
  availableBikes: number;
  average_rating?: number;
  total_ratings?: number;
}
