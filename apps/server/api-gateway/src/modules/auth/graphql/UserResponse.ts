import { ObjectType } from '@nestjs/graphql';
import { ApiResponseType } from '@mebike/shared';
import { User } from './User';
import { AuthPayload } from './AuthPayload';
import { RefreshToken } from './RefreshToken';

@ObjectType()
export class UserResponse extends ApiResponseType(User) {}

@ObjectType()
export class LoginResponse extends ApiResponseType(AuthPayload) {}

@ObjectType()
export class ResfreshTokenResponse extends ApiResponseType(RefreshToken) {}
