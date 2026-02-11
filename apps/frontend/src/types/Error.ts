interface ErrorResponse {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
    };
  };
}
interface ErrorWithMessage {
  message: string;
}
export type { ErrorResponse, ErrorWithMessage };