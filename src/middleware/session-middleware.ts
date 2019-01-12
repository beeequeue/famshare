import { Request, RequestHandler, Response } from 'express'
import { Base64 } from 'js-base64'
import { pick } from 'rambdax'

import { getUserById } from '../lib/discord'
import { Session } from '../lib/session'
import { User } from '../lib/user'

declare module 'express-serve-static-core' {
  interface Session {
    uuid: string
    user: Pick<User, PickedProps>
    expiresAt: Date
  }

  interface Request {
    session?: Session
    identifier?: string
    loggedIn: boolean

    authenticate: (userUuid: string) => void
  }
}

type PickedProps = 'uuid' | 'discordId' | 'email' | 'stripeId'
const getContextSession = async ({ uuid, userUuid, expiresAt }: Session) => {
  const user = await User.getByUuid(userUuid)

  return {
    uuid,
    user: pick<User, PickedProps>(
      ['uuid', 'discordId', 'email', 'stripeId'],
      user,
    ),
    expiresAt,
  }
}

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

  if (!session) {
    res.clearCookie('session')

    return next()
  }

  const user = await User.findByUuid(session.userUuid)

  if (!user) {
    res.clearCookie('session')

    return next()
  }

  const discordUser = await getUserById(user.discordId)

  req.session = await getContextSession(session)
  req.identifier = discordUser.username + '#' + discordUser.discriminator

  next()
}
