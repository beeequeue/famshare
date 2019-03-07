import { isNil } from 'rambdax'

import { User } from '@/modules/user/user.model'
import { UserQueryArgs, User as RUser } from '@/graphql/types'
import { Resolver } from '@/utils'

export const getUser: Resolver<RUser, UserQueryArgs> = async args => {
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

export const getViewer: Resolver<RUser> = async (_, request) => {
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
