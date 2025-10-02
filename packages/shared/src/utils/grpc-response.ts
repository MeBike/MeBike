import { RpcException } from '@nestjs/microservices';
import { ErrorResponse } from '../interfaces/api-response';

export function throwGrpcError(message: string, errors?: string[]): never {
  const errorResponse: ErrorResponse = { success: false, message, errors };
  throw new RpcException(errorResponse);
}

export function grpcResponse<T>(data: T, message = 'Success') {
  return {
    success: true,
    message,
    data,
  };
}

export function grpcPaginateResponse<T>(
  result: {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  },
  message = 'Success',
) {
  return {
    success: true,
    message,
    data: result.data,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  };
}
