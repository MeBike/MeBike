import SosAlert from '~/models/schemas/sos-alert.schema'
import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { RentalStatus, Role, SosAlertStatus } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/errors'
import { SOS_MESSAGE } from '~/constants/messages'
import HTTP_STATUS from '~/constants/http-status'
import { toObjectId } from '~/utils/string'
import { getLocalTime } from '~/utils/date-time'
import User from '~/models/schemas/user.schema'

class SosService {
  async createAlert({
    rental_id,
    requester_id,
    bike_id,
    agent_id,
    issue,
    latitude,
    longitude
  }: {
    rental_id: ObjectId
    requester_id: ObjectId
    bike_id: ObjectId
    agent_id: string
    issue: string
    latitude: number
    longitude: number
  }) {
    const alertData = new SosAlert({
      rental_id,
      requester_id,
      bike_id,
      sos_agent_id: toObjectId(agent_id),
      issue,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      status: SosAlertStatus.PENDING
    })

    const result = await databaseService.sos_alerts.insertOne(alertData)
    const alert = { ...alertData, _id: result.insertedId }

    // TODO: Push message to nearby SOS agents

    return alert
  }

  async confirmSos({
    sos_alert,
    solvable,
    agent_notes,
    photos
  }: {
    sos_alert: SosAlert
    solvable: boolean
    agent_notes: string
    photos?: string[]
  }) {
    const now = getLocalTime()
    const sosId = sos_alert._id as ObjectId
    const newStatus = solvable ? SosAlertStatus.RESOLVED : SosAlertStatus.UNSOLVABLE

    const update: any = {
      status: newStatus,
      agent_notes,
      photos,
      updated_at: now
    }
    if (solvable) update.resolved_at = now

    const updatedAlert = await databaseService.sos_alerts.findOneAndUpdate(
      { _id: sosId },
      { $set: update },
      { returnDocument: 'after' }
    )

    return updatedAlert
  }

  async rejectSos({ sos_alert, agent_notes, photos }: { sos_alert: SosAlert; agent_notes: string; photos?: string[] }) {
    const now = getLocalTime()
    const sosId = sos_alert._id as ObjectId

    const update: any = {
      status: SosAlertStatus.REJECTED,
      agent_notes,
      photos,
      updated_at: now
    }

    const updatedAlert = await databaseService.sos_alerts.findOneAndUpdate(
      { _id: sosId },
      { $set: update },
      { returnDocument: 'after' }
    )

    return updatedAlert
  }

  async getSosRequestById(sos: SosAlert, currentUser: User) {
    const sosId = sos._id as ObjectId

    const pipeline: any[] = [
      { $match: { _id: sosId } },
      {
        $lookup: {
          from: 'rentals',
          localField: 'rental_id',
          foreignField: '_id',
          as: 'rental'
        }
      },
      { $unwind: { path: '$rental', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'bikes',
          localField: 'bike_id',
          foreignField: '_id',
          as: 'bike'
        }
      },
      { $unwind: { path: '$bike', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'requester_id',
          foreignField: '_id',
          as: 'requester'
        }
      },
      { $unwind: { path: '$requester', preserveNullAndEmptyArrays: true } }
    ]

    if (currentUser.role === Role.Staff && sos.sos_agent_id) {
      pipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'sos_agent_id',
            foreignField: '_id',
            as: 'sos_agent'
          }
        },
        { $unwind: { path: '$sos_agent', preserveNullAndEmptyArrays: true } }
      )
    } else {
      pipeline.push({
        $addFields: { sos_agent: null }
      })
    }

    pipeline.push(
      {
        $project: {
          'rental.bike_id': 0,
          'rental.user_id': 0,
          'requester.password': 0,
          'requester.email_verify_otp': 0,
          'requester.email_verify_otp_expires': 0,
          'requester.forgot_password_otp': 0,
          'requester.forgot_password_otp_expires': 0,
          'sos_agent.password': 0,
          'sos_agent.email_verify_otp': 0,
          'sos_agent.email_verify_otp_expires': 0,
          'sos_agent.forgot_password_otp': 0,
          'sos_agent.forgot_password_otp_expires': 0,
          rental_id: 0,
          requester_id: 0,
          bike_id: 0
        }
      },
    )

    const [result] = await databaseService.sos_alerts.aggregate(pipeline).toArray()

    if (!result) {
      throw new ErrorWithStatus({
        message: SOS_MESSAGE.SOS_NOT_FOUND.replace('%s', sosId.toString()),
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return result
  }
}

const sosService = new SosService()
export default sosService
