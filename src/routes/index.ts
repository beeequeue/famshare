import Router from 'koa-router'

import { routes as discord } from './discord'

export const router = new Router()

router.prefix('/api')

router.get('/', ({ response }) => {
  response.body = { message: 'pong' }
})

router.use(discord)
