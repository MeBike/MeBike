import { Router } from "express";
import multer from "multer";

import { createSupplierController } from "~/controllers/suppliers.controllers";
import { createSupplierValidator } from "~/middlewares/supplier.middlewares";
import { wrapAsync } from "~/utils/handler";

const storage = multer.memoryStorage();

const upload = multer({ storage });

const suppliersRouter = Router();

suppliersRouter.post("/", upload.single("image"), createSupplierValidator, wrapAsync(createSupplierController));

export default suppliersRouter;
