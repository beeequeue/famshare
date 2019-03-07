import { Request, RequestHandler, Response } from 'express'
import { Base64 } from 'js-base64'

import { getUserById } from '@/lib/discord'
import { Session } from '@/modules/session/session.model'
import { User } from '@/modules/user/user.model'

declare module 'express-serve-static-core' {
  interface Request {
    session?: Session
    identifier?: string
    isLoggedIn: boolean

    authenticate: (userUuid: string) => void
  }
}

const authenticate = (req: Request, res: Response) => async (
  userUuid: string,
) => {
  const session = await Session.generate(userUuid)

  req.session = session
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

  req.isLoggedIn = false

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

  req.session = session
  req.isLoggedIn = true
  req.identifier = discordUser.username + '#' + discordUser.discriminator

  next()
}
