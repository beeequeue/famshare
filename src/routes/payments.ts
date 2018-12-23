import { unauthorized } from 'boom'
import { Router } from 'express'

import { User } from '../lib/user'

const {} = process.env as {
  [key: string]: string
}

export const router = Router()

router.post('/register-method', async (req, res) => {
  if (!req.session) throw unauthorized('Not logged in.')

  if (!req.body.token || typeof req.body.token !== 'string') {
    throw unauthorized('Invalid token received.')
  }

  const user = await User.getByUuid(req.session.user.uuid)

  const response = await user.createStripeCustomer(req.body.token)

  res.json(response)
})
