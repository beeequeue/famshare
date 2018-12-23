import { Request, RequestHandler, Response } from 'express'
import { Base64 } from 'js-base64'
import { pick } from 'rambdax'

import { getUserById } from '../lib/discord'
import { Session } from '../lib/session'
import { User } from '../lib/user'

declare module 'express-serve-static-core' {
  interface Session {
    uuid: string
    user: Pick<User, 'uuid' | 'discordId' | 'email'>
    expiresAt: Date
  }

  interface Request {
    session?: Session
    username?: string
    loggedIn: boolean

    authenticate: (userUuid: string) => void
  }
}

const getContextSession = async ({ uuid, userUuid, expiresAt }: Session) => ({
  uuid,
  user: pick(
    ['uuid', 'discordId', 'email'],
    await User.getByUuid(userUuid),
  ) as any,
  expiresAt,
})

const authenticate = (req: Request, res: Response) => async (
  userUuid: string,
) => {
  const session = await Session.generate(userUuid)

  req.session = await getContextSession(session)
  res.cookie('session', Base64.encode(req.session.uuid), {
    expires: session.expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
}

export const SessionMiddleware = (): RequestHandler => async (
  req,
  res,
  next,
) => {
  const cookie = req.cookies.session

  req.authenticate = authenticate(req, res)
  req.loggedIn = false

  if (!cookie) return next()

  const session = await Session.findByUuid(Base64.decode(cookie))

  if (!session) return next()

  const user = await User.getByUuid(session.userUuid)
  const discordUser = await getUserById(user.discordId)

  req.session = await getContextSession(session)
  req.username = discordUser.username

  next()
}
