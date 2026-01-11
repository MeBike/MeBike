import type { ServerContracts } from "@mebike/shared";

export type UserError = ApiUserError | NetworkUserError | DecodeUserError | UnknownUserError;

type UserErrorCode
  = | ServerContracts.UnauthorizedErrorResponse["details"]["code"]
    | ServerContracts.UsersContracts.UserErrorResponse["details"]["code"];

export type ApiUserError = {
  _tag: "ApiError";
  code: UserErrorCode;
  message?: string;
};

export type NetworkUserError = {
  _tag: "NetworkError";
  message?: string;
};

export type DecodeUserError = {
  _tag: "DecodeError";
};

export type UnknownUserError = {
  _tag: "UnknownError";
  message?: string;
};
