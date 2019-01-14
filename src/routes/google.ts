import { badRequest, unauthorized } from 'boom'
import { Router } from 'express'

import { Google } from '@/lib/google'
import { ConnectionEnum } from '@/db'

export const router = Router()

router.get('/connect', (req, res) => {
  if (!req.isLoggedIn) {
    throw unauthorized('You need to be logged in to connect a Google account.')
  }

  res.redirect(Google.connectUrl)
})

interface CallbackQuery {
  code?: string
}

router.get('/callback', async (req, res) => {
  if (!req.isLoggedIn) {
    throw unauthorized('You need to be logged in to connect a Google account.')
  }

  const { code } = req.query as CallbackQuery

  if (!code) {
    throw badRequest('Did not get a code back from Discord...')
  }

  const token = await Google.getAccessToken(code)

  const googleUser = await Google.getUserFromToken(token)

  if (!googleUser.email || !googleUser.verified_email) {
    throw badRequest(
      "You need to have verified the account's email to connect it.",
    )
  }

  const user = await req.session!.getUser()

  if (!user) {
    throw badRequest(
      "You need to have verified the account's email to connect it.",
    )
  }

  await user.connectWith({
    type: ConnectionEnum.GOOGLE,
    userId: googleUser.id,
    identifier: googleUser.name,
    picture: googleUser.picture,
    link: googleUser.link,
  })

  res.redirect('/')
})
