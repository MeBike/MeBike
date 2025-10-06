import { Router } from "express";

import {
  changeSupplierStatusController,
  createSupplierController,
  getAllSupplierStatController,
  getByIdController,
  getSupplierStatController,
  updateSupplierController,
} from "~/controllers/suppliers.controllers";
import {
  createSupplierValidator,
  updateSupplierStatusValidator,
  updateSupplierValidator,
} from "~/middlewares/supplier.middlewares";
import { accessTokenValidator } from "~/middlewares/users.middlewares";
import { wrapAsync } from "~/utils/handler";

const suppliersRouter = Router();

suppliersRouter.get("/stats", accessTokenValidator, wrapAsync(getAllSupplierStatController));
suppliersRouter.get("/:id", accessTokenValidator, wrapAsync(getByIdController));
suppliersRouter.get("/:id/stats", accessTokenValidator, wrapAsync(getSupplierStatController));
suppliersRouter.post("/", accessTokenValidator, createSupplierValidator, wrapAsync(createSupplierController));
suppliersRouter.put("/:id", accessTokenValidator, updateSupplierValidator, wrapAsync(updateSupplierController));
suppliersRouter.patch(
  "/:id",
  accessTokenValidator,
  updateSupplierStatusValidator,
  wrapAsync(changeSupplierStatusController),
);

export default suppliersRouter;
