import { readFileSync } from 'fs'
import { resolve } from 'path'
import { buildSchema } from 'graphql'
import Express from 'express'
import GraphQL from 'express-graphql'
import BodyParser from 'body-parser'
import CookieParser from 'cookie-parser'
import { format, transports } from 'winston'
import { logger as Logger } from 'express-winston'
import { SessionMiddleware } from '@/middleware/session-middleware'
import { ErrorHandler } from '@/middleware/error-handler'
import { router } from '@/routes'
import { IS_DEV } from '@/utils'

const { PORT } = process.env
const app = Express()

const SCHEMA = readFileSync(resolve(__dirname, 'schema.graphql')).toString()
const schema = buildSchema(SCHEMA)

const start = async () => {
  app.use(
    Logger({
      transports: [new transports.Console()],
      format: format.combine(format.colorize(), format.simple()),
      meta: false,
    }),
  )

  // app.use(KoaCORS())
  app.use(BodyParser.json())
  app.use(CookieParser())
  // app.use(Helmet())

  app.use(SessionMiddleware())

  app.use(router)

  app.post(
    '/graphql',
    GraphQL({
      schema,
      graphiql: false,
      pretty: IS_DEV,
    }),
  )

  app.get(
    '/graphql',
    GraphQL({
      schema,
      graphiql: true,
      pretty: IS_DEV,
    }),
  )

  app.use(ErrorHandler())

  app.listen(PORT || 3000, () => console.log(`Listening on ${PORT || 3000}`))
}

start()
