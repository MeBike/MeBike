import { BadRequestException } from '@nestjs/common';
import { ErrorResponseClient } from '../interfaces/api-response';

export function throwError(message: string, errors?: string[]): never {
  const errorResponse: ErrorResponseClient = {
    success: false,
    message,
    errors,
  };
  throw new BadRequestException(errorResponse);
}
