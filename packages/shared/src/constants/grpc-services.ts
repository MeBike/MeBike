export const GRPC_SERVICES = {
  AUTH: "AuthService" as string,
} as const;

export const GRPC_PACKAGE = {
  AUTH: "AUTH_PACKAGE" as string,
} as const;

export const USER_METHODS = {
  CREATE: "CreateUser" as string,
  GET_ONE: "GetUser" as string,
  UPDATE: "UpdateUser" as string,
  GET_ALL: "GetAllUsers" as string,
  LOGIN: "LoginUser" as string,
  REFRESH_TOKEN: "RefreshToken" as string,
} as const;
