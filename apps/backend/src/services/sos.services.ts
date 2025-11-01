import SosAlert from '~/models/schemas/sos-alert.schema'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { RentalStatus, SosAlertStatus } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/errors'
import { SOS_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import { toObjectId } from '~/utils/string'
import { getLocalTime } from '~/utils/date-time'

class SosService {
  async createAlert({
    rental_id,
    user_id,
    bike_id,
    issue,
    latitude,
    longitude
  }: {
    rental_id: ObjectId
    user_id: ObjectId
    bike_id: ObjectId
    issue: string
    latitude: number
    longitude: number
  }) {
    const alertData = new SosAlert({
      rental_id,
      user_id,
      bike_id,
      issue,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      status: SosAlertStatus.PENDING
    })

    const result = await databaseService.sos_alerts.insertOne(alertData)
    const alert = { ...alertData, _id: result.insertedId }

    // TODO: Push message to nearby SOS agents

    return alert
  }

  async dispatchSos({ sos_id, staff_id, agent_id }: { sos_id: string; staff_id: string; agent_id: string }) {
    const objSosId = toObjectId(sos_id)
    const now = getLocalTime()

    const result = await databaseService.sos_alerts.findOneAndUpdate(
      { _id: objSosId, status: SosAlertStatus.PENDING },
      {
        $set: {
          status: SosAlertStatus.DISPATCHED,
          sos_agent_id: toObjectId(agent_id),
          staff_id: toObjectId(staff_id),
          updated_at: now
        }
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new ErrorWithStatus({
        message: SOS_MESSAGE.SOS_NOT_FOUND.replace('%s', sos_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // TODO: Push message to this SOS agent

    return result
  }

  async confirmSos({
    sos_alert,
    confirmed,
    agent_notes,
    photos
  }: {
    sos_alert: SosAlert
    confirmed: boolean
    agent_notes: string
    photos?: string[]
  }) {
    const now = getLocalTime()
    const sosId = sos_alert._id as ObjectId
    const newStatus = confirmed ? SosAlertStatus.CONFIRMED : SosAlertStatus.REJECTED

    const update: any = {
      status: newStatus,
      agent_notes,
      photos,
      updated_at: now
    }
    if (confirmed) update.resolved_at = now

    const updatedAlert = await databaseService.sos_alerts.findOneAndUpdate(
      { _id: sosId }, 
      { $set: update }, 
      { returnDocument: 'after' }
    )

    return updatedAlert
  }
}

const sosService = new SosService()
export default sosService
