import { CronJob } from 'cron'
import reservationsService from '~/services/reservations.services'

const NOTIFICATION_CRON_SCHEDULE = '*/5 5-22 * * *' // Runs every 5 minutes, only between 5 AM and 10:59 PM
export const warningExpiryReservation = new CronJob(NOTIFICATION_CRON_SCHEDULE, async () => {
  console.log(`[Cron] Running notify and schedule cancellation job (${new Date().toLocaleTimeString()})`)
  try {
    const result = await reservationsService.notifyExpiringReservations()
    console.log(`[Cron] Notified ${result.count} reservations and scheduled cancellation checks.`)
  } catch (e) {
    console.error('[Cron Error] Error running reservation cron job:', e)
  }

  console.log(`Reservation cron jobs started. Active schedule: ${NOTIFICATION_CRON_SCHEDULE}`)
})
