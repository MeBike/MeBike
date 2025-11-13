import EventEmitter from 'events'
import type Redis from 'ioredis'

import logger from '~/lib/logger'
import { createRedisSubscriber } from '~/lib/redis-pubsub'

const BIKE_STATUS_CHANNEL = 'bike_status_updates'

type BikeStatusEvent = 'bikeStatusUpdate'

class BikeStatusEventBus extends EventEmitter {}

const eventBus = new BikeStatusEventBus()
let subscriber: Redis | null = null
let isInitialized = false

function initializeSubscriber() {
  if (isInitialized) return
  isInitialized = true

  subscriber = createRedisSubscriber()
  subscriber.subscribe(BIKE_STATUS_CHANNEL, (err) => {
    if (err) {
      logger.error({ err }, 'Failed to subscribe to bike status channel')
      return
    }
    logger.info(`Shared Redis subscriber listening on ${BIKE_STATUS_CHANNEL}`)
  })

  subscriber.on('message', (channel, message) => {
    if (channel === BIKE_STATUS_CHANNEL) {
      eventBus.emit('bikeStatusUpdate', message)
    }
  })

  subscriber.on('error', (err) => {
    logger.error({ err }, 'Redis subscriber error in bike status bus')
  })
}

export function getBikeStatusEventBus(): EventEmitter {
  initializeSubscriber()
  return eventBus
}

export function closeBikeStatusEventBus() {
  if (!subscriber) return
  subscriber.unsubscribe(BIKE_STATUS_CHANNEL).catch((err) => {
    logger.error({ err }, 'Failed to unsubscribe shared bike status subscriber')
  })
  subscriber.quit().catch((err) => {
    logger.error({ err }, 'Failed to quit shared bike status subscriber')
  })
  subscriber = null
  isInitialized = false
}

export type { BikeStatusEvent }
