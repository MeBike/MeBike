import type {
  GraphQLMutationResponse,
  AuthTokens,
  AccessToken,
  Me,
} from "@/types/GraphQL";

export type LoginResponse = GraphQLMutationResponse<"LoginUser", AuthTokens>;
export type RegisterResponse = GraphQLMutationResponse<
  "RegisterUser",
  RegisterResponse
>;
export type RefreshTokenResponse = GraphQLMutationResponse<"RefreshToken", AuthTokens>;
export type GetMeResponse = GraphQLMutationResponse<"User", Me>;