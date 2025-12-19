import type {
  GraphQLMutationResponse,
  AuthTokens,
  AccessToken,
  Me,
} from "@/types/GraphQL";

export type LoginResponse = GraphQLMutationResponse<"LoginUser", AuthTokens>;
export type RegisterResponse = GraphQLMutationResponse<
  "RegisterUser",
  AuthTokens
>;
export type RefreshTokenResponse = GraphQLMutationResponse<"RefreshToken", AuthTokens>;
export type GetMeResponse = GraphQLMutationResponse<"User", Me>;
export type LogOutResponse = GraphQLMutationResponse<"LogoutUser">;
export type ChangePasswordResponse = GraphQLMutationResponse<"ChangePassword">; 
export type UpdateProfileResponse = GraphQLMutationResponse<"UpdateProfile", Me>;
export type GetUsersResponse = GraphQLMutationResponse<"Users", Me[]>;
