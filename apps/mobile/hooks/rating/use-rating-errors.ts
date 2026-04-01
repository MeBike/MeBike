import type { RatingError } from "@services/ratings";

import { presentRatingError } from "@/presenters/ratings/rating-error-presenter";
import { isRatingApiError } from "@services/ratings";

export function getRatingErrorCode(error: RatingError): string | null {
  if (isRatingApiError(error)) {
    return error.code;
  }

  return null;
}

export function getRatingErrorMessage(error: RatingError, fallback: string): string {
  const message = presentRatingError(error, fallback);
  return message.trim() ? message : fallback;
}
