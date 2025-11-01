import SosAlert from '~/models/schemas/sos-alert.schema'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { SosAlertStatus } from '~/constants/enums'

export class SosService {
  static async createAlert({
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
}
