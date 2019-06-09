import { Router } from 'express'
import { User } from '@/modules/user/user.model'
import { isNil } from '@/utils'

export const sessionRouter = Router()

if (process.env.NODE_ENV === 'development') {
  sessionRouter.get('/dev_session', async (req, res) => {
    const user = await User.findByUuid(req.query.userUuid)

    if (isNil(user)) {
      return res.status(400).json({ message: 'not found' })
    }

    await req.authenticate(user.uuid)

    res.redirect('/')
  })

  sessionRouter.get('/dev_token', async (req, res) => {
    const user = await User.findByUuid(req.query.userUuid)

    if (isNil(user)) {
      return res.status(400).send(null)
    }

    await req.authenticate(user.uuid)

    res.json({ token: req.cookies.session })
  })
}
