import type { DashboardStats } from "@services/dashboard.service";

import { dashboardService } from "@services/dashboard.service";
import { useCallback, useEffect, useState } from "react";

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getDashboardStats();
      if (response.result) {
        setStats(response.result);
      }
    }
    catch (err) {
      setError("Không thể tải dữ liệu thống kê.");
      console.error("Failed to fetch dashboard stats:", err);
    }
    finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}
