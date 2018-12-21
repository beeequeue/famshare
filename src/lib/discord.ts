import superagent = require('superagent')
import { badRequest } from 'boom'

const {
  DISCORD_CLIENT,
  DISCORD_SECRET,
  DISCORD_REDIRECT_URI,
} = process.env as { [key: string]: string }
const DISCORD = 'https://discordapp.com/api'
const SCOPE = 'identify email'

const T = () => true

const isError = (response: superagent.Response) =>
  !response.ok || response.error

export const getAccessToken = async (code: string): Promise<string> => {
  const response = await superagent
    .post(`${DISCORD}/oauth2/token`)
    .type('form')
    .send({
      client_id: DISCORD_CLIENT,
      client_secret: DISCORD_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
      scope: SCOPE,
    })
    .ok(T)

  if (isError(response)) {
    throw badRequest('Could not get access token from Discord...')
  }

  return response.body.access_token
}

interface DiscordUser {
  id: string
  username: string
  discriminator: string
  email?: string
  verified?: boolean
  avatar?: string
  bot?: boolean
}

export const getUserFromToken = async (token: string): Promise<DiscordUser> => {
  const response = await superagent
    .get(`${DISCORD}/v6/users/@me`)
    .auth(token, { type: 'bearer' })
    .ok(T)

  if (isError(response)) {
    throw badRequest('Could not get user from token...')
  }

  return response.body
}

export const getUserById = async (id: string): Promise<DiscordUser> => {
  const response = await superagent
    .get(`${DISCORD}/v6/users/${id}`)
    .auth(DISCORD_SECRET, { type: 'bearer' })
    .ok(T)

  if (isError(response)) {
    throw badRequest('Could not get user from token...')
  }

  return response.body
}
