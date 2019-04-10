import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  ResolverInterface,
  Root,
} from 'type-graphql'
import { Request } from 'express'
import { notFound } from 'boom'

import { User } from '@/modules/user/user.model'
import { isNil } from '@/utils'

@Resolver()
export class UserResolver {
  @Query(() => User)
  async user(@Arg('uuid', () => ID) uuid: string) {
    const user = await User.findByUuid(uuid)

    if (isNil(user)) {
      throw notFound()
    }

    return user
  }

  @Query(() => User)
  async viewer(@Ctx() context: Request) {
    return context.session!.user
  }

  @Mutation(() => User)
  async connectStripe(
    @Arg('token', () => ID) token: string,
    @Ctx() context: Request,
  ): Promise<User> {
    const user = await context.session!.user

    await user.createStripeCustomer(token)

    return user
  }
}

@Resolver(() => User)
export class UserFieldResolver implements ResolverInterface<User> {
  @FieldResolver()
  async connections(@Root() user: User) {
    return await user.getConnections()
  }

  @FieldResolver()
  async subscriptions(@Root() user: User) {
    return await user.getSubscriptions()
  }
}
