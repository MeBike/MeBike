import type { Request, Response } from "express";
import HTTP_STATUS from "~/constants/http-status";
import { DASHBOARD_MESSAGES } from "~/constants/messages";
import databaseService from "~/services/database.services";
import ratingService from "~/services/ratings.services";
import { BikeStatus, UserVerifyStatus } from "~/constants/enums";

export const getStationsController = async (req: Request, res: Response) => {
  try {
    const pipeline: any[] = [
      {
        $lookup: {
          from: "bikes",
          localField: "_id",
          foreignField: "station_id",
          as: "bikesData",
        },
      },
      {
        $addFields: {
          availableBikesCount: {
            $size: {
              $filter: {
                input: "$bikesData", as: "bike",
                cond: { $eq: ["$$bike.status", BikeStatus.Available] },
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'rentals',
          localField: '_id',
          foreignField: 'start_station',
          as: 'rentals'
        }
      },
      {
        $unwind: { path: '$rentals', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'ratings',
          localField: 'rentals._id',
          foreignField: 'rental_id',
          as: 'ratings'
        }
      },
      {
        $unwind: { path: '$ratings', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: '$_id',
          station: { $first: '$$ROOT' },
          ratings: { $push: '$ratings.rating' }
        }
      },
      {
        $addFields: {
          'station.average_rating': {
            $cond: {
              if: { $gt: [{ $size: { $filter: { input: '$ratings', cond: { $ne: ['$$this', null] } } } }, 0] },
              then: { $avg: { $filter: { input: '$ratings', cond: { $ne: ['$$this', null] } } } },
              else: 0
            }
          },
          'station.total_ratings': { $size: { $filter: { input: '$ratings', cond: { $ne: ['$$this', null] } } } }
        }
      },
      {
        $replaceRoot: { newRoot: '$station' }
      },
      {
        $project: {
          name: 1,
          address: 1,
          availableBikes: '$availableBikesCount',
          average_rating: 1,
          total_ratings: 1,
          bikesData: 0,
          rentals: 0,
          ratings: 0,
        },
      }
    ];

    const stationsWithData = await databaseService.stations.aggregate(pipeline).toArray();

    return res.json({
      message: DASHBOARD_MESSAGES.STATIONS_FETCH_SUCCESS,
      result: stationsWithData
    });
  } catch (error) {
    console.error("Error fetching stations:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Error fetching stations",
      result: null
    });
  }
};

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

    const appRating = await ratingService.getAppRating();

    const result = {
      totalStations,
      totalBikes,
      totalUsers,
      appRating
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