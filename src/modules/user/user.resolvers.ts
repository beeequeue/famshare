import { Arg, Ctx, ID, Mutation, Query, Resolver } from 'type-graphql'
import { Request } from 'express'
import { notFound } from 'boom'

import { User } from '@/modules/user/user.model'
import { isNil } from '@/utils'

@Resolver()
export class UserResolver {
  @Query(() => User)
  public async user(@Arg('uuid', () => ID) uuid: string) {
    const user = await User.findByUuid(uuid)

    if (isNil(user)) {
      throw notFound()
    }

    return user
  }

  @Query(() => User)
  public async viewer(@Ctx() context: Request) {
    return context.session!.user
  }

  @Mutation(() => User)
  public async connectStripe(
    @Arg('token', () => ID) token: string,
    @Ctx() context: Request,
  ): Promise<User> {
    const user = context.session!.user

    await user.createStripeCustomer(token)

    return user
  }
}
