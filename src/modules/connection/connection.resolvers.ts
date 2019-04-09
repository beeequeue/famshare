import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Resolver,
  ResolverInterface,
  Root,
} from 'type-graphql'
import { Request } from 'express'
import { notFound } from 'boom'

import {
  Connection,
  ConnectionType,
} from '@/modules/connection/connection.model'
import { User } from '@/modules/user/user.model'
import { isNil, propEq } from '@/utils'

@Resolver()
export class ConnectionResolver {
  @Mutation(() => Connection)
  async deleteConnection(
    @Arg('type') type: ConnectionType,
    @Ctx() context: Request,
  ): Promise<User> {
    const user = await User.getByUuid(context.session!.user.uuid)
    const connections = await user.getConnections()
    const connection = connections.find(propEq('type', type))

    if (isNil(connection)) {
      throw notFound()
    }

    await connection.delete()

    return user
  }
}

@Resolver(() => Connection)
export class ConnectionFieldResolver implements ResolverInterface<Connection> {
  @FieldResolver()
  async owner(@Root() connection: Connection) {
    return await connection.getOwner()
  }
}
