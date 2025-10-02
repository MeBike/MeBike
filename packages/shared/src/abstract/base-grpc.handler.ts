import { validateOrReject } from 'class-validator';
import { throwGrpcError } from '../utils/grpc-response';
import { BaseService } from './base.service';
import { plainToInstance } from 'class-transformer';
import { SERVER_MESSAGE, USER_MESSAGES } from '../constants/messages';

export class BaseGrpcHandler<
  T,
  CreateDto extends object | never = never,
  UpdateDto extends object | never = never,
> {
  constructor(
    protected readonly service: BaseService<T, CreateDto, UpdateDto>,
    private readonly createDtoClass?: new () => CreateDto,
    private readonly updateDtoClass?: new () => UpdateDto,
  ) {}

  async createLogic(dto: CreateDto): Promise<T> {
    // Check if the create method is implemented in the service
    if (!this.service.create) {
      throwGrpcError(SERVER_MESSAGE.UNSUPPORTED_OPERATION, [
        'Create method is not implemented.',
      ]);
    }

    if (this.createDtoClass) {
      const dtoInstance = plainToInstance(this.createDtoClass, dto as object);

      try {
        await validateOrReject(dtoInstance);
      } catch (errors) {
        const messages: string[] = (errors as any[]).flatMap((err) =>
          Object.values(err.constraints ?? {}),
        );
        throwGrpcError(SERVER_MESSAGE.VALIDATION_FAILED, messages);
      }
    }

    try {
      const result = await this.service.create(dto);
      return result;
    } catch (error: any) {
      // Lỗi field unique trùng
      if (error?.code === 'P2002') {
        const fields: string[] = error.meta?.target ?? [];
        const messages = fields.map((field) => {
          switch (field) {
            case 'email':
              return USER_MESSAGES.EMAIL_EXISTED;
            default:
              return `${field} existed`;
          }
        });
        throwGrpcError(SERVER_MESSAGE.UNIQUE_CONSTRAINT_FAILED, messages);
      }

      // Lỗi Khi truyền một field FK không tồn tại trong database
      if (error?.code === 'P2003') {
        const field = error.meta?.field_name ?? 'relation';
        throwGrpcError(SERVER_MESSAGE.FOREIGN_KEY_FAILED, [
          SERVER_MESSAGE.FOREIGN_KEY_INVALID(field),
        ]);
      }

      throwGrpcError(SERVER_MESSAGE.DATABASE_ERROR, [
        error.message ?? SERVER_MESSAGE.UNEXPECTED_ERROR,
      ]);
    }
  }

  async getAllLogic(
    page = 1,
    limit = 10,
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.service.findAll(page, limit);
  }

  async getOneById(id: string): Promise<T | null> {
    return await this.service.findOne(id);
  }

  async updateLogic(id: string, dto: UpdateDto): Promise<T> {
    // Check if the update method is implemented in the service
    if (!this.service.update) {
      throwGrpcError(SERVER_MESSAGE.UNSUPPORTED_OPERATION, [
        SERVER_MESSAGE.UPDATED_NOT_IMPLEMENTED,
      ]);
    }

    if (this.updateDtoClass) {
      const dtoInstance = plainToInstance(this.updateDtoClass, dto);

      try {
        await validateOrReject(dtoInstance);
      } catch (errors: any) {
        const messages: string[] = (errors as any[]).flatMap((err) =>
          Object.values(err.constraints ?? {}),
        );
        throwGrpcError(SERVER_MESSAGE.VALIDATION_FAILED, messages);
      }
    }

    try {
      const result = await this.service.update(id, dto);
      return result;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const fields: string[] = error.meta?.target ?? [];
        const messages = fields.map((field) => {
          switch (field) {
            case 'email':
              return USER_MESSAGES.EMAIL_EXISTED;
            default:
              return `${field} existed`;
          }
        });
        throwGrpcError(SERVER_MESSAGE.UNIQUE_CONSTRAINT_FAILED, messages);
      }

      if (error?.code === 'P2003') {
        const field = error.meta?.field_name ?? 'relation';
        throwGrpcError(SERVER_MESSAGE.FOREIGN_KEY_FAILED, [
          SERVER_MESSAGE.FOREIGN_KEY_INVALID(field),
        ]);
      }

      throwGrpcError(SERVER_MESSAGE.DATABASE_ERROR, [
        error.message ?? SERVER_MESSAGE.UNEXPECTED_ERROR,
      ]);
    }
  }
}
