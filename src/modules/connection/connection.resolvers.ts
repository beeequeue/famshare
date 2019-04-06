import { notFound, unauthorized } from 'boom'

import { Connection } from '@/modules/connection/connection.model'
import { User } from '@/modules/user/user.model'
import {
  ConnectStripeMutationArgs,
  DeleteConnectionMutationArgs,
  User as IUser,
} from '@/graphql/types'
import { isNil, Resolver } from '@/utils'

export const deleteConnection: Resolver<
  IUser | null,
  DeleteConnectionMutationArgs
> = async (args, request) => {
  const connection = await Connection.findByUuid(args.uuid)

  if (isNil(connection)) {
    throw notFound()
  }

  await connection.delete()

  const user = await User.findByUuid(request.session!.user.uuid)

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
