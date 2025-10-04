import { Router } from "express";

import { createReportController, updateReportStatusController } from "~/controllers/reports.controllers";
import { updateReportValidator } from "~/middlewares/reports.middlewares";
import { wrapAsync } from "~/utils/handler";

const reportsRouter = Router();

reportsRouter.post("/", createReportController, wrapAsync(createReportController));
reportsRouter.put("/:reportID", updateReportValidator, wrapAsync(updateReportStatusController));

export default reportsRouter;
