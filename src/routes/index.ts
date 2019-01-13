import { Router } from 'express'

import { router as discord } from './discord'
import { router as google } from './google'
import { router as payments } from './payments'

export const router = Router()

router.use('/discord', discord)
router.use('/google', google)

router.use('/payments', payments)
