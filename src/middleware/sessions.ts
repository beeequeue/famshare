import { Base64 } from 'js-base64'
import { Context, Middleware } from 'koa'
import { pick } from 'rambdax'

import { Session } from '../lib/session'

declare module 'koa' {
  interface Session {
    uuid: string
    userUuid: string
    expiresAt: Date
  }

  interface Context {
    session?: Session

    authenticate: (userUuid: string) => void
  }
}

const getContextSession = pick(['uuid', 'userUuid', 'expiresAt'])

const authenticate = (ctx: Context) => async (userUuid: string) => {
  const session = await Session.generate(userUuid)

  ctx.session = getContextSession(session) as Session
  ctx.cookies.set('session', Base64.encode(ctx.session.uuid), {
    expires: session.expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
}

export const SessionMiddleware = (): Middleware => async (ctx, next) => {
  const cookie = ctx.cookies.get('session')

  ctx.authenticate = authenticate(ctx)

  if (!cookie) return next()

  const session = await Session.findByUuid(Base64.decode(cookie))

  if (!session) return next()

  ctx.session = getContextSession(session)

  next()
}
