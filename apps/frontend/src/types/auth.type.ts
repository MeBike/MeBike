import type {
  GraphQLMutationResponse,
  AuthTokens,
} from "@/types/GraphQL";

export type LoginResponse = GraphQLMutationResponse<"LoginUser", AuthTokens>;
export type RegisterResponse = GraphQLMutationResponse<
  "RegisterUser",
  RegisterResponse
>;
