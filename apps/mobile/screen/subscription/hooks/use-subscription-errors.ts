// may server be merciful
export function getSubscriptionErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const axiosError = error as {
    response?: {
      data?: { message?: string; errors?: Record<string, { msg?: string }> };
    };
    message?: string;
  };
  const apiMessage = axiosError?.response?.data?.message;
  if (apiMessage)
    return apiMessage;
  const errors = axiosError?.response?.data?.errors;
  if (errors) {
    const first = Object.values(errors)[0];
    if (first?.msg)
      return first.msg;
  }
  if (axiosError?.message)
    return axiosError.message;
  return fallback;
}
