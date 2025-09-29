import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import {
  LoginResponse,
  ResfreshTokenResponse,
  UserResponse,
} from './graphql/user-response';
import { GRAPHQL_NAME } from '@mebike/shared';
import { CreateUserInput } from './graphql/create-user-nput';
import { LoginInput } from './graphql/login';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => UserResponse, { name: GRAPHQL_NAME.CREATE })
  async register(@Args('body') body: CreateUserInput): Promise<UserResponse> {
    return this.authService.register(body);
  }

  @Mutation(() => LoginResponse, { name: GRAPHQL_NAME.LOGIN })
  async login(@Args('body') body: LoginInput): Promise<LoginResponse> {
    return this.authService.login(body);
  }

  @Mutation(() => ResfreshTokenResponse, { name: GRAPHQL_NAME.REFRESH_TOKEN })
  async refreshToken(
    @Args('refreshToken') refreshToken: string,
  ): Promise<ResfreshTokenResponse> {
    return this.authService.refreshToken(refreshToken);
  }
}
