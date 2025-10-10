import { Router } from "express";

import type { CreateSupplierReqBody, UpdateSupplierReqBody } from "~/models/requests/suppliers.request";

import {
  changeSupplierStatusController,
  createSupplierController,
  getAllSupplierController,
  getAllSupplierStatController,
  getByIdController,
  getSupplierStatController,
  updateSupplierController,
} from "~/controllers/suppliers.controllers";
import { isAdminValidator } from "~/middlewares/admin.middlewares";
import { filterMiddleware } from "~/middlewares/common.middlewares";
import {
  createSupplierValidator,
  updateSupplierStatusValidator,
  updateSupplierValidator,
} from "~/middlewares/supplier.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const suppliersRouter = Router();

suppliersRouter.get("/", accessTokenValidator, isAdminValidator, wrapAsync(getAllSupplierController));
suppliersRouter.get("/stats", accessTokenValidator, isAdminValidator, wrapAsync(getAllSupplierStatController));
suppliersRouter.get("/:id", accessTokenValidator, isAdminValidator, wrapAsync(getByIdController));
suppliersRouter.get("/:id/stats", accessTokenValidator, isAdminValidator, wrapAsync(getSupplierStatController));
suppliersRouter.post(
  "/",
  accessTokenValidator,
  isAdminValidator,
  filterMiddleware<CreateSupplierReqBody>(["address", "contract_fee", "name", "phone_number"]),
  createSupplierValidator,
  wrapAsync(createSupplierController),
);
suppliersRouter.put(
  "/:id",
  accessTokenValidator,
  isAdminValidator,
  filterMiddleware<UpdateSupplierReqBody>(["address", "contract_fee", "name", "phone_number"]),
  updateSupplierValidator,
  wrapAsync(updateSupplierController),
);
suppliersRouter.patch(
  "/:id",
  accessTokenValidator,
  isAdminValidator,
  updateSupplierStatusValidator,
  wrapAsync(changeSupplierStatusController),
);

export default suppliersRouter;
