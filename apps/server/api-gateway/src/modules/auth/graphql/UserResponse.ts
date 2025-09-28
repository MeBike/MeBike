import { ObjectType } from '@nestjs/graphql';
import { ApiResponseType } from '@mebike/common';
import { User } from './User';
import { AuthPayload } from './AuthPayload';
import { RefreshToken } from './RefreshToken';

@ObjectType()
export class UserResponse extends ApiResponseType(User) {}

@ObjectType()
export class LoginResponse extends ApiResponseType(AuthPayload) {}

@ObjectType()
export class UserListResponse extends ApiResponseType(User, {
  isArray: true,
}) {}

@ObjectType()
export class ResfreshTokenResponse extends ApiResponseType(RefreshToken) {}
