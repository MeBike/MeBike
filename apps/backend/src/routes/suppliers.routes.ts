import { Router } from "express";

import { createSupplierController } from "~/controllers/suppliers.controllers";
import { createSupplierValidator } from "~/middlewares/supplier.middlewares";
import { wrapAsync } from "~/utils/handler";

const suppliersRouter = Router();

suppliersRouter.post("/", createSupplierValidator, wrapAsync(createSupplierController));

export default suppliersRouter;
