import cors from 'cors'
import { config } from 'dotenv'
import express from 'express'
import process from 'node:process'
import swaggerUi from 'swagger-ui-express'

import { defaultErrorHandler } from './middlewares/error.middlewares'
import rentalsRouter from './routes/rentals.routes'
import reportsRouter from './routes/reports.routes'
import suppliersRouter from './routes/suppliers.routes'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import bikesRouter from './routes/bikes.routes'
import walletsRouter from './routes/wallets.routes'
import withdrawsRouter from './routes/withdraw.routes'
import refundsRouter from './routes/refunds.routes'
import swaggerDocument from '../public/openapi.json'

config()

import swaggerJSDoc from "swagger-jsdoc";
import stationRouter from "./routes/station.routes";
import reserveRouter from "./routes/reservations.routes";
import { warningExpiryReservation } from "./utils/cron/email.services";
import ratingRouter from './routes/rating.routes'
import { initQueue } from './lib/queue'
import sosRouter from './routes/sos.routes'
import dashboardRouter from './routes/dashboard.routes'
import subscriptionRouter from './routes/subscriptions.routes'
import fixedSlotTemplateRouter from './routes/fixed-slots.routes'
import eventsRouter from './routes/events.routes'
import { generateFixedSlotReservation } from './utils/cron/fixed-slots.services'

const port = process.env.PORT || 4000

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

databaseService.connect().then(async () => {
  databaseService.indexUsers()
  databaseService.indexBikes()
  databaseService.indexStations()
  databaseService.indexSuppliers()
  databaseService.indexReservation()
  databaseService.indexFixedSlot()
  databaseService.indexSubscription()
  // cron-job
  generateFixedSlotReservation.start()
  // bullmq
  initQueue()
})

app.get('/', (req, res) => {
  res.send('Welcome to MeBike API')
})

app.use('/users', usersRouter)
app.use('/reports', reportsRouter)
app.use('/suppliers', suppliersRouter)
app.use('/bikes', bikesRouter)
app.use('/wallets', walletsRouter)
app.use('/withdraws', withdrawsRouter)
app.use('/refunds', refundsRouter)
app.use('/rentals', rentalsRouter)
app.use('/stations', stationRouter)
app.use('/reservations', reserveRouter)
app.use('/ratings', ratingRouter)
app.use('/sos', sosRouter)
app.use('/dashboard', dashboardRouter)
app.use('/subscriptions', subscriptionRouter)
app.use('/fixed-slots', fixedSlotTemplateRouter)
app.use('/events', eventsRouter)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use(defaultErrorHandler)

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`MeBike Backend đang chạy tại http://localhost:${port}`)
})
