import { badRequest } from 'boom'
import Router from 'koa-router'
import uuid from 'uuid/v4'

import { User } from '../db/user'
import { getAccessToken, getUserFromToken } from '../lib/discord'

const { DISCORD_CLIENT, DISCORD_REDIRECT_URI } = process.env
const DISCORD = 'https://discordapp.com/api'
const SCOPE = 'identify email'

export const router = new Router()

router.prefix('/discord')

router.get('/login', ctx =>
  ctx.redirect(
    `${DISCORD}/oauth2/authorize` +
      `?client_id=${DISCORD_CLIENT}` +
      `&redirect_uri=${DISCORD_REDIRECT_URI}` +
      '&response_type=code' +
      `&scope=${SCOPE}`,
  ),
)

interface CallbackQuery {
  code?: string
}

router.get('/callback', async ctx => {
  const { code } = ctx.request.query as CallbackQuery

  if (!code) {
    throw badRequest('Did not get a code back from Discord...')
  }

  const token = await getAccessToken(code)

  const discordUser = await getUserFromToken(token)

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

  ctx.body = user
})

export const routes = router.routes()
