type BackendErrorDetail = {
  msg?: string;
};

type BackendErrorData = {
  message?: string;
  errors?: Record<string, BackendErrorDetail>;
  error?: string;
};

type BackendErrorResponse = {
  response?: {
    data?: BackendErrorData;
  };
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as BackendErrorResponse;
  const data = axiosError?.response?.data;

  if (data) {
    if (typeof data.message === "string" && data.message.trim().length > 0)
      return data.message.trim();

    if (data.errors) {
      for (const detail of Object.values(data.errors)) {
        if (detail?.msg)
          return detail.msg;
      }
    }

    if (typeof data.error === "string" && data.error.trim().length > 0)
      return data.error.trim();
  }

  if (axiosError?.message)
    return axiosError.message;

  return fallback;
}
