import { Router } from "express";

import { createReportController, updateReportStatusController } from "~/controllers/reports.controllers";
import { createReportValidator, updateReportValidator } from "~/middlewares/reports.middlewares";
import { wrapAsync } from "~/utils/handler";

const reportsRouter = Router();

reportsRouter.post("/", createReportValidator, wrapAsync(createReportController));
reportsRouter.put("/:reportID", updateReportValidator, wrapAsync(updateReportStatusController));

export default reportsRouter;
