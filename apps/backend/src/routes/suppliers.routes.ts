import { Router } from "express";

import {
  changeSupplierStatusController,
  createSupplierController,
  getAllSupplierStatController,
  getByIdController,
  getSupplierStatController,
  updateSupplierController,
} from "~/controllers/suppliers.controllers";
import { isAdminValidator } from "~/middlewares/admin.middlewares";
import {
  createSupplierValidator,
  updateSupplierStatusValidator,
  updateSupplierValidator,
} from "~/middlewares/supplier.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const suppliersRouter = Router();

suppliersRouter.get("/stats", accessTokenValidator, isAdminValidator, wrapAsync(getAllSupplierStatController));
suppliersRouter.get("/:id", accessTokenValidator, isAdminValidator, wrapAsync(getByIdController));
suppliersRouter.get("/:id/stats", accessTokenValidator, isAdminValidator, wrapAsync(getSupplierStatController));
suppliersRouter.post("/", accessTokenValidator, isAdminValidator, createSupplierValidator, wrapAsync(createSupplierController));
suppliersRouter.put("/:id", accessTokenValidator, isAdminValidator, updateSupplierValidator, wrapAsync(updateSupplierController));
suppliersRouter.patch(
  "/:id",
  accessTokenValidator,
  isAdminValidator,
  updateSupplierStatusValidator,
  wrapAsync(changeSupplierStatusController),
);

export default suppliersRouter;
