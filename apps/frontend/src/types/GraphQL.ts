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
export interface AccessToken {
  accessToken : string;
}
export interface RegisterResponse {
  email : string;
  password : string;
  id : string
}
export interface Me {
  id: string;
  accountId: string;
  name: string;
  YOB: number;
  role: string;
  verify: string;
  status: string;
  phone: string;
  avatar : string;
  userAccount : {
    email : string;
    id : string;
    password : string;
  };
  location?: string;
  username?: string;
  created_at?: string;
  updated_at?: string;
}