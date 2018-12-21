import Koa from 'koa'

import { router } from './routes'

const { PORT } = process.env
const app = new Koa()

// app.use(KoaCORS())
// app.use(BodyParser())
// app.use(Helmet())
// app.use(ErrorHandler())

app.use(router.routes())
app.use(router.allowedMethods())

app.listen(PORT || 3000, () => console.log(`Listening on ${PORT || 3000}`))
