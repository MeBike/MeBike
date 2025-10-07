import { Router } from "express";
import multer from "multer";

import type { CreateReportReqBody } from "~/models/requests/reports.requests";

import {
  createReportController,
  getAllReportController,
  getAllUserReportController,
  getByIdController,
  updateReportStatusController,
} from "~/controllers/reports.controllers";
import { isAdminValidator } from "~/middlewares/admin.middlewares";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import { createReportValidator, getAllReportValidator, getAllUserReportValidator, updateReportValidator } from "~/middlewares/reports.middlewares";
import { getIdValidator } from "~/middlewares/supplier.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const storage = multer.memoryStorage();

const upload = multer({ storage });

const reportsRouter = Router();

// get all cho users
reportsRouter.get("/", accessTokenValidator, getAllUserReportValidator, wrapAsync(getAllUserReportController));
// get all cho admin
reportsRouter.get("/manage-reports", accessTokenValidator, isAdminValidator, getAllReportValidator, wrapAsync(getAllReportController));
reportsRouter.get("/:reportID", accessTokenValidator, getIdValidator, wrapAsync(getByIdController));
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
  getIdValidator,
  filterMiddleware(["newStatus", "staff_id", "priority"]),
  updateReportValidator,
  wrapAsync(updateReportStatusController),
);

export default reportsRouter;
