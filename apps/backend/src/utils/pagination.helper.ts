import type { NextFunction, Request, Response } from "express";
import type { Collection, Document, Filter, Document as Projection } from "mongodb";
import { normalizeDecimal } from "./string";

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
    const normalized = data.map(normalizeDecimal)

    const responseBody: IResponseSearch<any> = {
      data: normalized,
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

export function sendPaginatedResponseFromRedis<T>(res: Response, next: NextFunction, data: T[], query: Record<string, any>) {
  try {
    const page = Number.parseInt(query.page as string) || 1;
    const limit = Number.parseInt(query.limit as string) || 10;
    const start = (page - 1) * limit;

    const paginatedData = data.slice(start, start + limit);

    const responseBody: IResponseSearch<any> = {
      data: paginatedData,
      pagination: {
        limit,
        currentPage: page,
        totalPages: Math.ceil(data.length / limit),
        totalRecords: data.length,
      },
    };

    return res.status(200).json(responseBody);
  }
  catch (error) {
    next(error);
  }
}

export async function sendPaginatedAggregationResponse<T extends Document>(
  res: Response,
  next: NextFunction,
  collection: Collection<T>,
  query: Request['query'],
  pipeline: Document[]
) {
  try {
    const page = Number.parseInt(query.page as string) || 1
    const limit = Number.parseInt(query.limit as string) || 10
    const skip = (page - 1) * limit

    const [totalRecordsResult, data] = await Promise.all([
      // Pipeline to count the total matching documents
      collection.aggregate([...pipeline, { $count: 'total' }]).toArray(),
      // Pipeline to get the actual data for the current page
      collection.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]).toArray()
    ])

    const totalRecords = totalRecordsResult.length > 0 ? totalRecordsResult[0].total : 0
    const totalPages = Math.ceil(totalRecords / limit)

    const normalized = data.map(normalizeDecimal)

    const responseBody: IResponseSearch<any> = {
      data: normalized,
      pagination: {
        limit,
        currentPage: page,
        totalPages,
        totalRecords
      }
    }

    return res.status(200).json(responseBody)
  } catch (error) {
    next(error)
  }
}