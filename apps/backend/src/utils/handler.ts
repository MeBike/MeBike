import type { NextFunction, Request, RequestHandler, Response } from "express";

export function wrapAsync<P>(func: RequestHandler<P>) {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next);
    }
    catch (error) {
      next(error);
    }
  };
}
