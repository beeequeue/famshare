import BodyParser from 'body-parser'
import CookieParser from 'cookie-parser'
import Express from 'express'
import { Builder, Nuxt } from 'nuxt'

import config from '../nuxt.config.js'
import { SessionMiddleware } from './middleware/sessions'
import { router } from './routes'

const { PORT } = process.env
const app = Express()
const nuxt = new Nuxt(config)

const start = async () => {
  // app.use(KoaCORS())
  app.use(BodyParser.json())
  app.use(CookieParser())
  // app.use(Helmet())

  app.use(SessionMiddleware())
  // app.use(ErrorHandler())

  if (process.env.NODE_ENV === 'development') {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  app.use(router)

  app.use(nuxt.render)

  app.listen(PORT || 3000, () => console.log(`Listening on ${PORT || 3000}`))
}

start()
