import { Arg, Ctx, Mutation, Resolver } from 'type-graphql'
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
  public async deleteConnection(
    @Arg('type') type: ConnectionType,
    @Ctx() context: Request,
  ): Promise<User> {
    const user = await User.getByUuid(context.session!.user.uuid)
    const connections = await user.connections()
    const connection = connections.find(propEq('type', type))

    if (isNil(connection)) {
      throw notFound()
    }

    await connection.delete()

    return user
  }
}
