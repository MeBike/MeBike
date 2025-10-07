import type { NextFunction, Request, Response } from "express";

import { pick } from "lodash";

type FilterKeys<T> = Array<keyof T>;

export function filterMiddleware<T>(filterKey: FilterKeys<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKey);
    next();
  };
}
