import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/CreateUserDto';
import {
  BaseGrpcHandler,
  SERVER_MESSAGE,
  throwGrpcError,
  UserRole,
} from '@mebike/shared';
import { grpcResponse } from '@mebike/shared';
import type { User } from '../../../server/src/generated/prisma';
import { USER_MESSAGES } from '@mebike/shared';
import { LoginUserDto } from './dto/LoginUserDto';
import { GRPC_SERVICES, USER_METHODS } from '@mebike/shared';
import bcrypt from 'bcrypt';

@Controller()
export class AuthGrpcController {
  private readonly baseHandler: BaseGrpcHandler<User, CreateUserDto, never>;

  constructor(private readonly authService: AuthService) {
    this.baseHandler = new BaseGrpcHandler(this.authService, CreateUserDto);
  }

  @GrpcMethod(GRPC_SERVICES.AUTH, USER_METHODS.CREATE)
  async createUser(data: CreateUserDto) {
    try {
      if (data.password !== data.confirmPassword) {
        return throwGrpcError(SERVER_MESSAGE.BAD_REQUEST, [
          'Password and Confirm Password do not match',
        ]);
      }
      const hashPassword: string = await bcrypt.hash(data.password, 10);

      const userData = { ...data, role: UserRole.USER, password: hashPassword };

      const result = await this.baseHandler.createLogic(userData);
      return grpcResponse(result, USER_MESSAGES.CREATE_SCUCCESS);
    } catch (error) {
      const err = error as Error;
      throw new RpcException(err?.message || USER_MESSAGES.CREATE_FAILED);
    }
  }

  @GrpcMethod(GRPC_SERVICES.AUTH, USER_METHODS.LOGIN)
  async login(data: LoginUserDto) {
    const result = await this.authService.validateUser(data);

    const { accessToken, refreshToken } =
      await this.authService.generateToken(result);

    return grpcResponse(
      { accessToken, refreshToken },
      USER_MESSAGES.LOGIN_SUCCESS,
    );
  }

  @GrpcMethod(GRPC_SERVICES.AUTH, USER_METHODS.REFRESH_TOKEN)
  async refreshToken(data: { refreshToken: string }) {
    const { refreshToken } = data;

    if (!refreshToken) {
      throwGrpcError(SERVER_MESSAGE.BAD_REQUEST, [
        USER_MESSAGES.REFRESH_TOKEN_REQUIRED,
      ]);
    }

    const result = await this.authService.refreshToken(refreshToken);
    return grpcResponse(result, USER_MESSAGES.REFRESH_TOKEN_SUCCESSFULLY);
  }
}
