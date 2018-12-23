import { Router } from 'express'

import { router as discord } from './discord'
import { router as payments } from './payments'

export const router = Router()

router.use('/discord', discord)

router.use('/payments', payments)
