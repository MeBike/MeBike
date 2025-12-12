import type {
  ServerErrorDetail,
  ServerErrorResponse,
  StationErrorCode,
  StationErrorDetail,
} from "@mebike/shared";

export const internalServerErrorResponse: ServerErrorResponse = {
  error: "Internal Server Error",
};

export function makeServerErrorResponse(error: string, details?: ServerErrorDetail): ServerErrorResponse {
  return {
    error,
    details,
  };
}

export function makeStationErrorResponse(code: StationErrorCode, extras?: Omit<StationErrorDetail, "code">): ServerErrorResponse {
  return {
    error: "Station error",
    details: { code, ...extras },
  };
}
