import { notFound, unauthorized } from 'boom'
import { User } from '@/modules/user/user.model'
import {
  ConnectStripeMutationArgs,
  User as IUser,
  UserQueryArgs,
} from '@/graphql/types'
import { isNil, Resolver } from '@/utils'

export const user: Resolver<IUser | null, UserQueryArgs> = async args => {
  const user = await User.findByUuid(args.uuid)

  if (isNil(user)) {
    throw notFound()
  }

  return user.toGraphQL()
}

export const viewer: Resolver<IUser | null> = async (_, request) => {
  const { session } = request

  if (isNil(session)) {
    throw unauthorized()
  }

  return session.user.toGraphQL()
}

export const connectStripe: Resolver<IUser, ConnectStripeMutationArgs> = async (
  args,
  request,
) => {
  const user = await request.session!.user

  await user.createStripeCustomer(args.token)

  return user.toGraphQL()
}
