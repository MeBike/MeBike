import { Router } from "express";

import {
  changeSupplierStatusController,
  createSupplierController,
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

suppliersRouter.post("/", accessTokenValidator, createSupplierValidator, wrapAsync(createSupplierController));
suppliersRouter.put("/:id", accessTokenValidator, updateSupplierValidator, wrapAsync(updateSupplierController));
suppliersRouter.patch(
  "/:id",
  accessTokenValidator,
  updateSupplierStatusValidator,
  wrapAsync(changeSupplierStatusController),
);

export default suppliersRouter;
