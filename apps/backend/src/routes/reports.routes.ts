import { Router } from "express";

import { createReportController, updateReportStatusController } from "~/controllers/reports.controllers";
import { wrapAsync } from "~/utils/handler";

const reportsRouter = Router();

reportsRouter.post("/", wrapAsync(createReportController));
reportsRouter.put("/:reportID/:newStatus", wrapAsync(updateReportStatusController));

export default reportsRouter;
