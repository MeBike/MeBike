import { RpcException } from "@nestjs/microservices";

import type { ErrorResponse } from "../interfaces/api-response";

export function throwGrpcError(message: string, errors?: string[]): never {
  const errorResponse: ErrorResponse = { success: false, message, errors };
  throw new RpcException(errorResponse);
}

export function grpcResponse<T>(data: T, message = "Success") {
  return {
    success: true,
    message,
    data,
  };
}
