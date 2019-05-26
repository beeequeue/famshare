import { RequestHandler, Response } from 'express'
import { unauthorized } from 'boom'
import { Base64 } from 'js-base64'

import { Discord } from '@/modules/discord/discord.lib'
import { Session } from '@/modules/session/session.model'
import { User } from '@/modules/user/user.model'
import { isNil } from '@/utils'
import { NOT_LOGGED_IN } from '@/errors'

declare module 'express-serve-static-core' {
  interface ISession {
    session: Session
    user: User
    identifier: string
  }

  // eslint-disable-next-line @typescript-eslint/interface-name-prefix
  interface Request {
    session?: ISession

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    authenticate: ReturnType<typeof authenticate>
  }
}

const DOMAIN = process.env.DOMAIN!.startsWith('.')
  ? process.env.DOMAIN
  : `.${process.env.DOMAIN}`

const authenticate = (res: Response) => async (userUuid: string) => {
  const session = await Session.generate(userUuid)

  res.cookie('session', Base64.encode(session.uuid), {
    domain: DOMAIN,
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
  const discordUser = await Discord.getUserById(user.discordId)

  req.session = {
    session,
    user,
    identifier: discordUser.username + '#' + discordUser.discriminator,
  }

  next()
}

export const assertLoggedIn = (): RequestHandler => (req, res, next) => {
  if (!isNil(req.session)) return next()

  res.status(401)
  res.send(unauthorized(NOT_LOGGED_IN).output.payload)
}
