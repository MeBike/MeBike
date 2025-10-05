import { Router } from "express";

import { changeSupplierStatusController, createSupplierController, updateSupplierController } from "~/controllers/suppliers.controllers";
import { createSupplierValidator, updateSupplierStatusValidator, updateSupplierValidator } from "~/middlewares/supplier.middlewares";
import { wrapAsync } from "~/utils/handler";

const suppliersRouter = Router();

suppliersRouter.post("/", createSupplierValidator, wrapAsync(createSupplierController));
suppliersRouter.put("/:id", updateSupplierValidator, wrapAsync(updateSupplierController));
suppliersRouter.patch("/:id", updateSupplierStatusValidator, wrapAsync(changeSupplierStatusController));

export default suppliersRouter;
