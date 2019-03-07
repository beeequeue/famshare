import { isNil } from 'rambdax'

import { User } from '@/modules/user/user.model'
import {
  ConnectStripeMutationArgs,
  User as IUser,
  UserQueryArgs,
} from '@/graphql/types'
import { Resolver } from '@/utils'

export const user: Resolver<IUser | null, UserQueryArgs> = async args => {
  const user = await User.findByUuid(args.uuid)

  if (isNil(user)) {
    return null
  }

  return user.toGraphQL()
}

export const viewer: Resolver<IUser | null> = async (_, request) => {
  const { session } = request

  if (isNil(session)) {
    return null
  }

  const user = await User.findByUuid(session.userUuid)

  if (isNil(user)) {
    return null
  }

  return user.toGraphQL()
}

export const connectStripe: Resolver<IUser, ConnectStripeMutationArgs> = async (
  args,
  request,
) => {
  const user = await request.session!.getUser()

  await user.createStripeCustomer(args.token)

  return user.toGraphQL()
}
