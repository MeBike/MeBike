export type UserError = ApiUserError | NetworkUserError | DecodeUserError | UnknownUserError;

export type UserErrorCode
  = | "UNAUTHORIZED"
    | "USER_NOT_FOUND"
    | "DUPLICATE_EMAIL"
    | "DUPLICATE_PHONE_NUMBER"
    | "UNKNOWN";

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
