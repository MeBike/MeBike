import type { NextFunction, Request, Response } from "express";
import type { ValidationChain } from "express-validator";
import type { RunnableValidationChains } from "express-validator/lib//middlewares/schema";

import { validationResult } from "express-validator";

import { EntityError, ErrorWithStatus } from "~/models/errors";

export function validate(validation: RunnableValidationChains<ValidationChain>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req);
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const errorObjects = errors.mapped();
    const entityError = new EntityError({ errors: {} });
    for (const key in errorObjects) {
      const { msg } = errorObjects[key];
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg);
      }
      entityError.errors[key] = { msg: msg instanceof Error ? msg.message : msg };
    }
    next(entityError);
  };
}
