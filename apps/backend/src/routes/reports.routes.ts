import { Router } from "express";
import multer from "multer";

import { createReportController, updateReportStatusController } from "~/controllers/reports.controllers";
import { createReportValidator, updateReportValidator } from "~/middlewares/reports.middlewares";
import { wrapAsync } from "~/utils/handler";

const storage = multer.memoryStorage();

const upload = multer({ storage });

const reportsRouter = Router();

reportsRouter.post("/", upload.array("files", 10), createReportValidator, wrapAsync(createReportController));
reportsRouter.put("/:reportID", updateReportValidator, wrapAsync(updateReportStatusController));

export default reportsRouter;
