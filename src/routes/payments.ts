import { unauthorized, badRequest } from 'boom'
import { Router } from 'express'

import { User } from '../lib/user'

export const router = Router()

router.post('/register-method', async (req, res) => {
  if (!req.session) throw unauthorized('Not logged in.')

  if (req.session.user.stripeId)
    throw badRequest('User already has payment method set up.')

  if (!req.body.token || typeof req.body.token !== 'string') {
    throw unauthorized('Invalid token received.')
  }

  const user = await User.getByUuid(req.session.user.uuid)

  await user.createStripeCustomer(req.body.token)

  res.json({ message: 'OK' })
})
