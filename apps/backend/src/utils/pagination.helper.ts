import type { NextFunction, Request, Response } from "express";
import type { Collection, Document, Filter, Document as Projection } from "mongodb";

export type IResponseSearch<T> = {
  data: T[];
  pagination: {
    limit: number;
    currentPage: number;
    totalPages: number;
    totalRecords: number;
  };
};

export async function sendPaginatedResponse<T extends Document>(res: Response, next: NextFunction, collection: Collection<T>, query: Request["query"], filter: Filter<T> = {}, projection: Projection = {}) {
  try {
    const page = Number.parseInt(query.page as string) || 1;
    const limit = Number.parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [totalRecords, data] = await Promise.all([
      collection.countDocuments(filter),
      collection.find(filter, { projection }).sort({ created_at: -1 }).skip(skip).limit(limit).toArray(),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    const responseBody: IResponseSearch<any> = {
      data,
      pagination: {
        limit,
        currentPage: page,
        totalPages,
        totalRecords,
      },
    };

    return res.status(200).json(responseBody);
  }
  catch (error) {
    next(error);
  }
}
