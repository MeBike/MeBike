import SosAlert from '~/models/schemas/sos-alert.schema'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { SosAlertStatus } from '~/constants/enums'
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
        message: SOS_MESSAGE.SOS_NOT_FOUND.replace("%s", sos_id),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    // TODO: Push message to this SOS agent

    return result
  }
}

const sosService = new SosService()
export default sosService
