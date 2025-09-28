import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import {
  LoginResponse,
  ResfreshTokenResponse,
  UserListResponse,
  UserResponse,
} from './graphql/UserResponse';
import { GRAPHQL_NAME } from '@mebike/shared';
import { CreateUserInput } from './graphql/CreateUserInput';
import { UpdateUserInput } from './graphql/UpdateUserInput';
import { LoginInput } from './graphql/Login';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => UserListResponse, { name: GRAPHQL_NAME.GET_ALL })
  async getAllUser(): Promise<UserListResponse> {
    return this.authService.getAllUser();
  }

  @Query(() => UserResponse, { name: GRAPHQL_NAME.GET_ONE })
  async getUserDetail(@Args('id') id: string): Promise<UserResponse> {
    return this.authService.userDetail(id);
  }

  @Mutation(() => UserResponse, { name: GRAPHQL_NAME.CREATE })
  async register(@Args('body') body: CreateUserInput): Promise<UserResponse> {
    return this.authService.register(body);
  }

  @Mutation(() => UserResponse, { name: GRAPHQL_NAME.UPDATE })
  async udpdateProfile(
    @Args('id') id: string,
    @Args('body') body: UpdateUserInput,
  ): Promise<UserResponse> {
    return this.authService.updateUser(id, body);
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
