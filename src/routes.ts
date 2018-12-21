import Router from 'koa-router'

export const router = new Router()

router.prefix('/api')

router.get('/', ({ response }) => {
  response.body = { message: 'pong' }
})
