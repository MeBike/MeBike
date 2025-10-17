import { IotCardTapMessageSchema } from "@mebike/shared";

import { getCommandPublisherInstance } from "../publishers/context";
import { createRentalFromCard } from "../services/backend-api";

export async function handleCardTapMessage(topic: string, payload: string): Promise<void> {
  try {
    const raw = JSON.parse(payload);
    const parsed = IotCardTapMessageSchema.safeParse(raw);

    if (!parsed.success) {
      console.warn(`[card-tap] ${topic}: invalid payload`, parsed.error.flatten());
      return;
    }

    const request = parsed.data;
    console.info(`[card-tap] ${topic}: dispatching card ${request.card_uid} for chip ${request.chip_id}`);

    const response = await createRentalFromCard(request);
    console.info(`[card-tap] backend response: ${response.message}`);

    const commandPublisher = getCommandPublisherInstance();
    if (!commandPublisher) {
      console.warn("[card-tap] command publisher not available; skipping state command");
      return;
    }

    try {
      if (response.mode === "started" || response.mode === "reservation_started") {
        await commandPublisher.sendBookingCommand("book", request.chip_id);
        console.info(`[card-tap] sent booking command for chip ${request.chip_id}`);
        await commandPublisher.sendStateCommand("booked", request.chip_id);
        console.info(`[card-tap] requested booked state for chip ${request.chip_id}`);
      } else if (response.mode === "ended") {
        await commandPublisher.sendBookingCommand("release", request.chip_id);
        console.info(`[card-tap] sent release command for chip ${request.chip_id}`);
        await commandPublisher.sendStateCommand("available", request.chip_id);
        console.info(`[card-tap] requested available state for chip ${request.chip_id}`);
      }
    }
    catch (error) {
      console.error(`[card-tap] failed to send command for ${request.chip_id}`, error);
    }
  }
  catch (error) {
    console.error(`[card-tap] failed to process message on ${topic}`, error);
  }
}
