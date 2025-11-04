import { Router } from "express";
import { getDashboardStatsController } from "~/controllers/dashboard.controllers";
import { wrapAsync } from "~/utils/handler";

const dashboardRouter = Router();

/**
 * Description: Get dashboard statistics (total stations, bikes, users)
 * Path: /dashboard/stats
 * Method: GET
 * Roles: Public (for landing page)
 */
dashboardRouter.get("/stats", wrapAsync(getDashboardStatsController));

export default dashboardRouter;