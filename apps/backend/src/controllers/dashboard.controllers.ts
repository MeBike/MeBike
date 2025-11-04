import type { Request, Response } from "express";
import HTTP_STATUS from "~/constants/http-status";
import { DASHBOARD_MESSAGES } from "~/constants/messages";
import databaseService from "~/services/database.services";
import { BikeStatus, UserVerifyStatus } from "~/constants/enums";

export const getDashboardStatsController = async (req: Request, res: Response) => {
  try {
    const totalStations = await databaseService.stations.countDocuments();

    const activeBikeStatuses = [BikeStatus.Available, BikeStatus.Booked, BikeStatus.Broken, BikeStatus.Reserved, BikeStatus.Maintained];
    const totalBikes = await databaseService.bikes.countDocuments({
      status: { $in: activeBikeStatuses }
    });

    const activeUserStatuses = [UserVerifyStatus.Unverified, UserVerifyStatus.Verified];
    const totalUsers = await databaseService.users.countDocuments({
      verify: { $in: activeUserStatuses }
    });

    const result = {
      totalStations,
      totalBikes,
      totalUsers
    };

    return res.json({
      message: DASHBOARD_MESSAGES.GET_DASHBOARD_STATS_SUCCESS,
      result
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: DASHBOARD_MESSAGES.GET_DASHBOARD_STATS_ERROR,
      result: null
    });
  }
};