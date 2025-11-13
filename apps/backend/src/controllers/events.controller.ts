import { Request, Response } from 'express'

import logger from '~/lib/logger'
import { getBikeStatusEventBus } from '~/lib/bike-status-event-bus'

import { drainPendingBikeStatus } from '~/lib/pending-bike-status'
import { TokenPayLoad } from '~/models/requests/users.requests'

export const eventStreamController = (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayLoad
  req.socket.setKeepAlive(true)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const heartbeat = setInterval(() => {
    res.write('event: ping\ndata: keepalive\n\n')
  }, 25_000)

  const eventBus = getBikeStatusEventBus()
  const handleMessage = (message: string) => {
    logger.debug({ message }, 'Forwarding bike status update to SSE client.')
    res.write(`event: bikeStatusUpdate\ndata: ${message}\n\n`)
  }

  eventBus.on('bikeStatusUpdate', handleMessage)
  res.write('event: open\ndata: Connection established\n\n')

  const pendingMessages = drainPendingBikeStatus(user_id)
  pendingMessages.forEach((message) => {
    res.write(`event: bikeStatusUpdate\ndata: ${message}\n\n`)
  })

  req.on('close', () => {
    logger.info('SSE client disconnected.')
    eventBus.off('bikeStatusUpdate', handleMessage)
    clearInterval(heartbeat)
    res.end()
  })
}
