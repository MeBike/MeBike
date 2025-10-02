import { BadRequestException } from '@nestjs/common';
import { ErrorResponse } from '../interfaces/api-response';

export function throwError(message: string, errors?: string[]): never {
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    errors,
  };
  throw new BadRequestException(errorResponse);
}
