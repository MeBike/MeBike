import { Router } from "express";
import multer from "multer";

import type { CreateReportReqBody } from "~/models/requests/reports.requests";

import { createReportController, updateReportStatusController } from "~/controllers/reports.controllers";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import { createReportValidator, updateReportValidator } from "~/middlewares/reports.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const storage = multer.memoryStorage();

const upload = multer({ storage });

const reportsRouter = Router();

reportsRouter.post(
  "/",
  accessTokenValidator,
  filterMiddleware<CreateReportReqBody>(["bike_id", "location", "files", "message", "rental_id", "station_id", "type"]),
  upload.array("files", 10),
  createReportValidator,
  wrapAsync(createReportController),
);
reportsRouter.put(
  "/:reportID",
  accessTokenValidator,
  filterMiddleware(["newStatus"]),
  updateReportValidator,
  wrapAsync(updateReportStatusController),
);

export default reportsRouter;
