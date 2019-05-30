import { Request } from 'express'
import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Mutation,
  Resolver,
  ResolverInterface,
  Root,
} from 'type-graphql'
import { badRequest } from 'boom'

import { Subscription } from '@/modules/subscription/subscription.model'
import { Plan } from '@/modules/plan/plan.model'
import { User } from '@/modules/user/user.model'
import { Invite } from '@/modules/invite/invite.model'

import { isNil } from '@/utils'

@Resolver()
export class SubscriptionResolver {
  @Mutation(() => Plan)
  public async subscribe(
    @Arg('invitationId', () => ID) invitationId: string,
    @Ctx() context: Request,
  ): Promise<Plan> {
    const invite = await Invite.findByShortId(invitationId)

    if (isNil(invite)) {
      throw badRequest('Invalid invitation!')
    }
    const { plan } = invite

    await plan.subscribeUser(context.session!.user.uuid, invitationId)

    return plan
  }
}

@Resolver(() => Subscription)
export class SubscriptionFieldResolver
  implements ResolverInterface<Subscription> {
  @FieldResolver()
  public async plan(@Root() subscription: Subscription) {
    return Plan.getByUuid(subscription.planUuid)
  }

  @FieldResolver()
  public async user(@Root() subscription: Subscription) {
    return User.getByUuid(subscription.userUuid)
  }

  @FieldResolver()
  public async invite(@Root() subscription: Subscription) {
    return Invite.getByUuid(subscription.inviteUuid)
  }
}
