import 'reflect-metadata'
import Express from 'express'
import CORS from 'cors'
import BodyParser from 'body-parser'
import CookieParser from 'cookie-parser'
import Helmet from 'helmet'
import { transports } from 'winston'
import { logger as Logger } from 'express-winston'

import {
  assertLoggedIn,
  SessionMiddleware,
} from '@/middleware/session-middleware'
import { ErrorHandler } from '@/middleware/error-handler'
import { router } from '@/routes'
import { GraphQLMiddleware } from '@/graphql'

const { PORT } = process.env
const app = Express()

const start = async () => {
  app.use(
    Logger({
      transports: [new transports.Console()],
      meta: false,
    }),
  )

  app.use(
    CORS({
      origin: true,
      credentials: true,
    }),
  )
  app.use(BodyParser.json())
  app.use(CookieParser())
  app.use(Helmet())

  app.use(SessionMiddleware())

  app.use(router)

  app.post('/graphql', assertLoggedIn(), await GraphQLMiddleware())

  app.get('/graphql', assertLoggedIn(), await GraphQLMiddleware(true))

  app.use(ErrorHandler())

  app.listen(PORT || 3100, () => console.log(`Listening on ${PORT || 3100}`))
}

start()
