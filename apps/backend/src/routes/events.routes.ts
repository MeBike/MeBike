import { Router } from 'express'
import { eventStreamController } from '~/controllers/events.controller'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handler'

const eventsRouter = Router()

eventsRouter.get('/', accessTokenValidator, wrapAsync(eventStreamController))

export default eventsRouter
