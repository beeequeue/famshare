import { badRequest } from 'boom'
import { Router } from 'express'
import uuid from 'uuid/v4'

import { Discord } from '@/modules/discord/discord.lib'
import { User } from '@/modules/user/user.model'

const { DISCORD_CLIENT } = process.env
const DISCORD = 'https://discordapp.com/api'
const SCOPE = 'identify email'

const getCallbackUrl = (hostname: string) =>
  `https://${hostname}/discord/callback`

export const discordRouter = Router()

discordRouter.get('/login', (req, res) =>
  res.redirect(
    `${DISCORD}/oauth2/authorize` +
      `?client_id=${encodeURIComponent(DISCORD_CLIENT as string)}` +
      `&redirect_uri=${encodeURIComponent(getCallbackUrl(req.hostname))}` +
      '&response_type=code' +
      `&scope=${encodeURIComponent(SCOPE)}`,
  ),
)

interface ICallbackQuery {
  code?: string
}

discordRouter.get('/callback', async (req, res) => {
  const { code } = req.query as ICallbackQuery

  if (!code) {
    throw badRequest('Did not get a code back from Discord...')
  }

  const token = await Discord.getAccessToken(code, getCallbackUrl(req.hostname))

  const discordUser = await Discord.getUserFromToken(token)

  if (!discordUser.email || !discordUser.verified) {
    throw badRequest(
      'You need to have a verified email address to use this service.',
    )
  }

  let user: User | null = await User.findByDiscordId(discordUser.id)

  if (!user) {
    user = new User({
      uuid: uuid(),
      discordId: discordUser.id,
      email: discordUser.email,
    })

    await user.save()
  }

  req.authenticate(user.uuid)

  res.redirect('/')
})
