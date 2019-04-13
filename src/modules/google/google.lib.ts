import { badRequest } from 'boom'
import superagent from 'superagent'

const { GOOGLE_CLIENT, GOOGLE_SECRET } = process.env as {
  [key: string]: string
}
const SCOPE = 'email profile'

const T = () => true
const isError = (response: superagent.Response) =>
  !response.ok || response.error

interface IGoogleUser {
  id: string
  name: string
  given_name: string
  family_name: string
  gender: string
  email: string
  verified_email: boolean
  picture: string
  locale: string
  link: string
}

export class Google {
  private static getCallbackUrl = (hostname: string) =>
    `https://${hostname}/google/callback`

  public static getConnectUrl = (hostname: string) =>
    'https://accounts.google.com/o/oauth2/v2/auth' +
    `?client_id=${encodeURIComponent(GOOGLE_CLIENT as string)}` +
    `&redirect_uri=${encodeURIComponent(Google.getCallbackUrl(hostname))}` +
    '&access_type=online' +
    '&include_granted_scopes=true' +
    `&scope=${encodeURIComponent(SCOPE)}` +
    '&response_type=code'

  public static getAccessToken = async (
    code: string,
    hostname: string,
  ): Promise<string> => {
    const response = await superagent
      .post('https://www.googleapis.com/oauth2/v4/token')
      .query({
        code,
        /* eslint-disable @typescript-eslint/camelcase */
        client_id: GOOGLE_CLIENT,
        client_secret: GOOGLE_SECRET,
        redirect_uri: Google.getCallbackUrl(hostname),
        grant_type: 'authorization_code',
        /* eslint-enable @typescript-eslint/camelcase */
      })
      .ok(T)

    if (isError(response)) {
      throw badRequest(
        'Could not get access token from Google...',
        response.body,
      )
    }

    return response.body.access_token
  }

  public static getUserFromToken = async (
    token: string,
  ): Promise<IGoogleUser> => {
    const response = await superagent
      .get(`https://www.googleapis.com/userinfo/v2/me`)
      .auth(token, { type: 'bearer' })
      .ok(T)

    if (isError(response)) {
      throw badRequest('Could not get user from token...')
    }

    return response.body
  }
}
