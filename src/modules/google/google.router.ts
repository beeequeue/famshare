import { badRequest, unauthorized } from 'boom'
import { Router } from 'express'

import { ConnectionType } from '@/modules/connection/connection.model'
import { Google } from '@/modules/google/google.lib'
import { isNil } from '@/utils'

export const googleRouter = Router()

googleRouter.get('/connect', (req, res) => {
  if (isNil(req.session)) {
    throw unauthorized('You need to be logged in to connect a Google account.')
  }

  res.redirect(Google.getConnectUrl(req.hostname))
})

interface ICallbackQuery {
  code?: string
}

googleRouter.get('/callback', async (req, res) => {
  if (isNil(req.session)) {
    throw unauthorized('You need to be logged in to connect a Google account.')
  }

  const { code } = req.query as ICallbackQuery

  if (!code) {
    throw badRequest('Did not get a code back from Discord...')
  }

  const token = await Google.getAccessToken(code, req.hostname)

  const googleUser = await Google.getUserFromToken(token)

  if (!googleUser.email || !googleUser.verified_email) {
    throw badRequest(
      "You need to have verified the account's email to connect it.",
    )
  }

  const user = req.session.user

  await user.connectWith({
    type: ConnectionType.GOOGLE,
    userId: googleUser.id,
    identifier: googleUser.name,
    picture: googleUser.picture,
    link: googleUser.link,
  })

  res.redirect('/')
})
