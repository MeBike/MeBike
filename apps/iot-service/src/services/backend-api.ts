import { BackendContracts } from "@mebike/shared";

import { env } from "../config";

const { CardRentalRequestSchema, CardRentalResponseSchema } = BackendContracts;

const CARD_RENTAL_ENDPOINT = "/rentals/card-rental";

type ErrorBody = {
  message?: unknown;
};

export async function createRentalFromCard(request: BackendContracts.CardRentalRequest) {
  const payload = CardRentalRequestSchema.parse(request);

  const url = new URL(CARD_RENTAL_ENDPOINT, env.BACKEND_API_URL);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();

  let body: unknown;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  }
  catch {
    throw new Error(`Backend response is not JSON (status ${response.status})`);
  }

  if (!response.ok) {
    const errorBody = body as ErrorBody;
    const errorMessage = typeof errorBody?.message === "string"
      ? errorBody.message
      : `Backend request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return CardRentalResponseSchema.parse(body);
}
