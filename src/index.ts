import Express from 'express'
import BodyParser from 'body-parser'
import CookieParser from 'cookie-parser'

import { SessionMiddleware } from './middleware/session-middleware'
import { ErrorHandler } from './middleware/error-handler'
import { router } from './routes'

const { PORT } = process.env
const app = Express()

const start = async () => {
  // app.use(KoaCORS())
  app.use(BodyParser.json())
  app.use(CookieParser())
  // app.use(Helmet())

  app.use(SessionMiddleware())

  app.use(router)

  app.use(ErrorHandler())

  app.listen(PORT || 3000, () => console.log(`Listening on ${PORT || 3000}`))
}

start()
