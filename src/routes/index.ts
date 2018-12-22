import Router from 'koa-router'

import { routes as discord } from './discord'

export const router = new Router()

router.prefix('/api')

router.get('/', ({ response, session }) => {
  response.body = {
    message: 'pong',
    session,
  }
})

router.use(discord)
