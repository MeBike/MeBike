import { CronJob } from "cron"
import { generateFixedSlotQueue } from "~/lib/queue/reservation.queue"


export const generateFixedSlotReservation = new CronJob('0 0 * * *', async () => {
  console.log(`[Cron] Running notify and schedule expiration job (${new Date().toLocaleTimeString()})`)
  try {
    await generateFixedSlotQueue.add('generate-fixed-slot', {}, { jobId: 'fixed-slot-today' })
  } catch (e) {
    console.error('[Cron Error] Error running reservation cron job:', e)
  }

  console.log(`Fixed slot cron jobs started. Active schedule: '5 0 * * *'`)
})