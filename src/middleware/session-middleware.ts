import { Request, Request as IRequest, RequestHandler, Response } from 'express'
import { unauthorized } from 'boom'
import { Base64 } from 'js-base64'

import { getUserById } from '@/lib/discord'
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

  interface Request {
    session?: ISession

    authenticate: (userUuid: string) => void
  }
}

declare module 'express' {
  interface GraphqlRequest extends IRequest {
    body: {
      operationName?: string
      query: string
      variables: {
        [key: string]: any | undefined
      }
    }
  }
}

const getBaseDomain = (req: Request) => {
  const subdomains = req.subdomains
    .splice(1)
    .reverse()
    .join('.')

  if (subdomains.length < 1) {
    return req.hostname
  }

  return req.hostname.replace(subdomains + '.', '')
}

const authenticate = (req: Request, res: Response) => async (
  userUuid: string,
) => {
  const session = await Session.generate(userUuid)
  console.log('.' + getBaseDomain(req))

  res.cookie('session', Base64.encode(session.uuid), {
    domain: '.' + getBaseDomain(req),
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

export const assertLoggedIn = (): RequestHandler => (req, res, next) => {
  if (!isNil(req.session)) return next()

  res.status(401)
  res.send(unauthorized(NOT_LOGGED_IN).output.payload)
}
