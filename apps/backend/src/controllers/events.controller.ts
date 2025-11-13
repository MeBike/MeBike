import { Request, Response } from 'express'
import { createRedisSubscriber } from '~/lib/redis-pubsub'
import logger from '~/lib/logger'

const BIKE_STATUS_CHANNEL = 'bike_status_updates'

export const eventStreamController = (req: Request, res: Response) => {
  const subscriber = createRedisSubscriber();
  req.socket.setKeepAlive(true);

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const heartbeat = setInterval(() => {
    res.write('event: ping\ndata: keepalive\n\n')
  }, 25_000)

  subscriber.subscribe(BIKE_STATUS_CHANNEL, (err, count) => {
    if (err) {
      logger.error({ err }, 'Error subscribing to Redis channel')
      subscriber.unsubscribe(BIKE_STATUS_CHANNEL).catch(() => {})
      subscriber.quit().catch(() => {})
      clearInterval(heartbeat)
      res.end()
      return
    }
    logger.info(`Subscribed to ${count} channel(s). Listening on ${BIKE_STATUS_CHANNEL}.`)
  });

  subscriber.on('message', (channel, message) => {
    if (channel === BIKE_STATUS_CHANNEL) {
      logger.debug({ channel, message }, 'Forwarding message from Redis to client.')
      res.write(`event: bikeStatusUpdate\ndata: ${message}\n\n`)
    }
  });

  res.write('event: open\ndata: Connection established\n\n')

  req.on('close', () => {
    logger.info('Client disconnected. Cleaning up Redis subscriber.')
    subscriber.unsubscribe(BIKE_STATUS_CHANNEL)
    subscriber.quit()
    clearInterval(heartbeat)
    res.end()
  });
}
