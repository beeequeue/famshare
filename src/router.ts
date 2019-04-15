import { Router } from 'express'

import { discordRouter } from '@/modules/discord/discord.router'
import { googleRouter } from '@/modules/google/google.router'

export const router = Router()

router.use('/discord', discordRouter)
router.use('/google', googleRouter)
