import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';
import { CreateUserInput } from './graphql/CreateUserInput';
import { GRPC_PACKAGE, GRPC_SERVICES } from '@mebike/shared';
import { LoginInput } from './graphql/Login';

interface AuthServiceClient {
  LoginUser(data: LoginInput): Observable<any>;
  CreateUser(data: CreateUserInput): Observable<any>;
  RefreshToken(refreshToken: object): Observable<any>;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private userService!: AuthServiceClient;

  constructor(@Inject(GRPC_PACKAGE.AUTH) private client: ClientGrpc) {}

  onModuleInit() {
    this.userService = this.client.getService<AuthServiceClient>(
      GRPC_SERVICES.AUTH,
    );
  }

  async login(data: LoginInput) {
    return await lastValueFrom(this.userService.LoginUser(data));
  }

  async register(data: CreateUserInput) {
    return await lastValueFrom(this.userService.CreateUser(data));
  }

  async refreshToken(refreshToken: string) {
    console.log(refreshToken);
    return await lastValueFrom(this.userService.RefreshToken({ refreshToken }));
  }
}
