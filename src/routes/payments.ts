import { unauthorized, badRequest } from 'boom'
import { Router } from 'express'

export const router = Router()

router.post('/register-method', async (req, res) => {
  if (!req.isLoggedIn) throw unauthorized('Not logged in.')

  const user = await req.session!.getUser()

  if (user.stripeId) {
    throw badRequest('User already has payment method set up.')
  }

  if (!req.body.token || typeof req.body.token !== 'string') {
    throw unauthorized('Invalid token received.')
  }

  await user.createStripeCustomer(req.body.token)

  res.json({ message: 'OK' })
})
