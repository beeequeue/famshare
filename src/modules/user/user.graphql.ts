import { Request } from 'express'
import { isNil } from 'rambdax'

import { User } from '@/modules/user/user.model'
import { UserQueryArgs, User as RUser } from '@/graphql/types'

export const getUser = async (
  args: UserQueryArgs,
  _request: Request,
): Promise<RUser | null> => {
  const user = await User.findByUuid(args.uuid)

  if (isNil(user)) {
    return null
  }

  return {
    uuid: user.uuid,
    email: user.email,
    discordId: user.discordId,
    stripeId: user.stripeId,
    createdAt: user.createdAt.toISOString(),
  }
}

export const getViewer = async (
  _: null,
  request: Request,
): Promise<RUser | null> => {
  const { session } = request

  if (isNil(session)) {
    return null
  }

  const user = await User.findByUuid(session.userUuid)

  if (isNil(user)) {
    return null
  }

  return {
    uuid: user.uuid,
    email: user.email,
    discordId: user.discordId,
    stripeId: user.stripeId,
    createdAt: user.createdAt.toISOString(),
  }
}
