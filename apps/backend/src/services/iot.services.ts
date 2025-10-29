import {
  postV1DevicesDeviceIdCommandsBooking,
  postV1DevicesDeviceIdCommandsReservation,
  postV1DevicesDeviceIdCommandsState,
  IotBookingCommand,
  IotReservationCommand,
  IotStateCommand,
  ErrorResponse
} from '@mebike/shared/sdk/iot-service'
import { BusinessLogicError } from '@mebike/shared/src/contracts/iot-service/errors'
import databaseService from './database.services'
import { toObjectId } from '~/utils/string'
import { ObjectId } from 'mongodb'
import logger from '~/lib/logger'

class IoTService {
  private readonly iotServiceUrl: string

  constructor() {
    this.iotServiceUrl = process.env.IOT_SERVICE_URL || 'http://iot-service:3000'
  }

  async sendBookingCommand(deviceId: string, command: IotBookingCommand) {
    try {
      const actualDeviceId = await this.getDeviceId(deviceId)
      const response = await postV1DevicesDeviceIdCommandsBooking(actualDeviceId, {
        command
      }, {
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.status !== 202) {
        throw new Error(`IoT booking command failed: ${response.status}`)
      }

      return response.data
    } catch (error) {
      const errorResponse = error as { data?: ErrorResponse; status?: number }
      const iotError = errorResponse.data?.error
      const businessLogicError = errorResponse.data?.details as BusinessLogicError | undefined

      logger.error({
        deviceId,
        command,
        status: errorResponse.status,
        iotError,
        businessLogicError
      }, 'IoT booking command failed')

     
      return null
    }
  }

  async sendReservationCommand(deviceId: string, command: IotReservationCommand) {
    try {
      const actualDeviceId = await this.getDeviceId(deviceId)
      const response = await postV1DevicesDeviceIdCommandsReservation(actualDeviceId, {
        command
      }, {
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.status !== 202) {
        throw new Error(`IoT reservation command failed: ${response.status}`)
      }

      return response.data
    } catch (error) {
      const errorResponse = error as { data?: ErrorResponse; status?: number }
      const iotError = errorResponse.data?.error
      const businessLogicError = errorResponse.data?.details as BusinessLogicError | undefined

      logger.error({
        deviceId,
        command,
        status: errorResponse.status,
        iotError,
        businessLogicError
      }, 'IoT reservation command failed')

    
      return null
    }
  }

  async sendStateCommand(deviceId: string, state: IotStateCommand) {
    try {
      const actualDeviceId = await this.getDeviceId(deviceId)
      const response = await postV1DevicesDeviceIdCommandsState(actualDeviceId, {
        state
      }, {
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.status !== 202) {
        throw new Error(`IoT state command failed: ${response.status}`)
      }

      return response.data
    } catch (error) {
      const errorResponse = error as { data?: ErrorResponse; status?: number }
      const iotError = errorResponse.data?.error
      const businessLogicError = errorResponse.data?.details as BusinessLogicError | undefined

      logger.error({
        deviceId,
        state,
        status: errorResponse.status,
        iotError,
        businessLogicError
      }, 'IoT state command failed')

    
      return null
    }
  }

 

  async getDeviceId(bikeIdOrChipId: string): Promise<string> {
 
    try {
      new ObjectId(bikeIdOrChipId)
      logger.debug({ bikeId: bikeIdOrChipId }, 'Detected ObjectId, looking up bike')

      const bike = await databaseService.bikes.findOne({
        _id: toObjectId(bikeIdOrChipId)
      })

      if (!bike) {
        logger.error({ bikeId: bikeIdOrChipId }, 'Bike not found for ObjectId')
        throw new Error(`Bike not found: ${bikeIdOrChipId}`)
      }

      logger.debug({ bikeId: bike._id, chipId: bike.chip_id }, 'Found bike with chip_id')
      return bike.chip_id
    } catch (objectIdError) {
    
      logger.debug({ chipId: bikeIdOrChipId }, 'Using chip_id directly')
      return bikeIdOrChipId
    }
  }
}

const iotService = new IoTService()
export default iotService