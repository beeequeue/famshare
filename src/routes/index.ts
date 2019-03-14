import { Router } from 'express'

import { router as discord } from './discord'
import { router as google } from './google'

export const router = Router()

router.get('/', (_, res) => res.redirect('/graphql'))

router.use('/discord', discord)
router.use('/google', google)
