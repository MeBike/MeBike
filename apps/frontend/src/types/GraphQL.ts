export interface BaseMutationResponse<T> {
  data: T;
  errors?: { message: string; [key: string]: any }[] | null;
  message: string;
  statusCode: number;
  success: boolean;
}
export interface GraphQLMutationResponse<MutationName extends string, Payload> {
  data: {
    [K in MutationName]: BaseMutationResponse<Payload>;
  };
}
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
export interface RegisterResponse {
  email : string;
  password : string;
  id : string
}