export interface ErrorObject {
  message: string;
  [key: string]: unknown;
}

export interface BaseMutationResponse<T = null> {
  data: T | null;
  errors?: (string | ErrorObject)[] | null;
  message: string;
  statusCode: number;
  success: boolean;
}
export interface GraphQLMutationResponse<
  MutationName extends string,
  Payload = null,
> {
  data: {
    [K in MutationName]: BaseMutationResponse<Payload>;
  } | null;
  errors?: (string | ErrorObject)[] | null;
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
  email:string;
  status: string;
  phone: string;
  userAccount: {
    email: string;
    id: string;
    password: string;
  };
  address : string;
  location?: string;
  avatarUrl?: string;
  username?: string;
  createdAt?: string;
  nfcCardUid?: string;
  updatedAt?: string;
}