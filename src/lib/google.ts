import { badRequest } from 'boom'
import superagent from 'superagent'

const { GOOGLE_CLIENT, GOOGLE_SECRET } = process.env as {
  [key: string]: string
}
const SCOPE = 'email profile'
export const GOOGLE_REDIRECT_URI = 'https://famshare.ngrok.io/google/callback'

const T = () => true
const isError = (response: superagent.Response) =>
  !response.ok || response.error

interface GoogleUser {
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
  public static connectUrl =
    'https://accounts.google.com/o/oauth2/v2/auth' +
    `?client_id=${encodeURIComponent(GOOGLE_CLIENT as string)}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    '&access_type=online' +
    '&include_granted_scopes=true' +
    `&scope=${encodeURIComponent(SCOPE)}` +
    '&response_type=code'

  public static getAccessToken = async (code: string): Promise<string> => {
    const response = await superagent
      .post('https://www.googleapis.com/oauth2/v4/token')
      .query({
        code,
        client_id: GOOGLE_CLIENT,
        client_secret: GOOGLE_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
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
  ): Promise<GoogleUser> => {
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
