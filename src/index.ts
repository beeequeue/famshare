import http from 'http'

import { createApp } from '@/app'

const { PORT } = process.env

const start = async () => {
  const app = await createApp()

  const server = http.createServer(app)

  server.listen(PORT || 3100, () => {
    // eslint-disable-next-line no-console
    console.log('Listening on ' + (PORT || 3100))
  })
}

start()
