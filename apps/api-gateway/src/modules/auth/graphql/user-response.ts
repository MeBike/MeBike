import { ObjectType } from '@nestjs/graphql';
import { ApiResponseType } from '@mebike/shared';
import { User } from './user';
import { AuthPayload } from './auth-payload';
import { RefreshToken } from './refresh-token';

@ObjectType()
export class UserResponse extends ApiResponseType(User) {}

@ObjectType()
export class LoginResponse extends ApiResponseType(AuthPayload) {}

@ObjectType()
export class ResfreshTokenResponse extends ApiResponseType(RefreshToken) {}
