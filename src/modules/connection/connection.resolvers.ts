import { notFound } from 'boom'

import { User } from '@/modules/user/user.model'
import { DeleteConnectionMutationArgs, User as IUser } from '@/graphql/types'
import { isNil, propEq, IResolver } from '@/utils'

export const deleteConnection: IResolver<
  IUser | null,
  DeleteConnectionMutationArgs
> = async (args, request) => {
  const user = await User.getByUuid(request.session!.user.uuid)
  const connections = await user.getConnections()
  const connection = connections.find(propEq('type', args.type))

  if (isNil(connection)) {
    throw notFound()
  }

  await connection.delete()

  if (isNil(user)) {
    throw notFound()
  }

  return user.toGraphQL()
}
