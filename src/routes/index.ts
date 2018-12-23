import { Router } from 'express'

import { router as discord } from './discord'

export const router = Router()

router.use('/discord', discord)
