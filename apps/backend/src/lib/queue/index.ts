import { reservationExpireWorker, reservationNotifyWorker } from "./reservation.queue"

export async function initQueue() {
  await reservationNotifyWorker.waitUntilReady()
  await reservationExpireWorker.waitUntilReady()
  console.log('Queue and Worker initialized!')
}