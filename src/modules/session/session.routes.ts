import { NextFunction, Request, Router } from 'express'
import { User } from '@/modules/user/user.model'
import { isNil } from '@/utils'
import { badRequest, notFound } from 'boom'

const assertGoodRequest = (req: Request, next: NextFunction) => {
  if (req.connection.remoteAddress !== req.connection.localAddress) {
    return next()
  }

  if (isNil(req.query.email)) {
    throw badRequest('Missing email.')
  }
}

export const sessionRouter = Router()

if (process.env.NODE_ENV === 'development') {
  sessionRouter.get('/dev_session', async (req, res, next) => {
    assertGoodRequest(req, next)

    const user = await User.findByEmail(req.query.email)

    if (isNil(user)) {
      throw notFound()
    }

    await req.authenticate(user.uuid)

    res.redirect('/')
  })

  sessionRouter.get('/dev_token', async (req, res, next) => {
    assertGoodRequest(req, next)

    const user = await User.findByEmail(req.query.email)

    if (isNil(user)) {
      throw notFound()
    }

    await req.authenticate(user.uuid)

    res.json({ token: req.cookies.session })
  })
}
