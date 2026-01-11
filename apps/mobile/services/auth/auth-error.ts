import type { ServerContracts } from "@mebike/shared";

export type AuthError = ApiAuthError | NetworkAuthError | DecodeAuthError | UnknownAuthError;

type AuthErrorCode = ServerContracts.AuthContracts.AuthErrorResponse["details"]["code"];

export type ApiAuthError = {
  _tag: "ApiError";
  code: AuthErrorCode;
  message?: string;
};

export type NetworkAuthError = {
  _tag: "NetworkError";
  message?: string;
};

export type DecodeAuthError = {
  _tag: "DecodeError";
};

export type UnknownAuthError = {
  _tag: "UnknownError";
  message?: string;
};
