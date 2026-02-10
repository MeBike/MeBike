export type AuthError = ApiAuthError | NetworkAuthError | DecodeAuthError | UnknownAuthError;

export type AuthErrorCode
  = | "INVALID_CREDENTIALS"
    | "INVALID_REFRESH_TOKEN"
    | "INVALID_OTP"
    | "DUPLICATE_EMAIL"
    | "DUPLICATE_PHONE_NUMBER"
    | "UNKNOWN";

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
