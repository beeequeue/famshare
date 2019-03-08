import { RequestHandler, Response } from 'express'
import { Base64 } from 'js-base64'

import { getUserById } from '@/lib/discord'
import { Session } from '@/modules/session/session.model'
import { User } from '@/modules/user/user.model'

declare module 'express-serve-static-core' {
  interface ISession {
    session: Session
    user: User
    identifier: string
  }

  interface Request {
    session?: ISession

    authenticate: (userUuid: string) => void
  }
}

const authenticate = (res: Response) => async (userUuid: string) => {
  const session = await Session.generate(userUuid)

  res.cookie('session', Base64.encode(session.uuid), {
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

  req.authenticate = authenticate(res)

  if (!cookie) return next()

  const session = await Session.findByUuid(Base64.decode(cookie))

  if (!session) {
    res.clearCookie('session')

    return next()
  }

  const user = await User.getByUuid(session.userUuid)
  const discordUser = await getUserById(user.discordId)

  req.session = {
    session,
    user,
    identifier: discordUser.username + '#' + discordUser.discriminator,
  }

  next()
}
