import { AxiosError } from "axios";

export default function getAxiosErrorCodeMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.details.code || error.message;
  }

  return "Error registering";
};
