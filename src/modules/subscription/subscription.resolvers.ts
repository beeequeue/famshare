import { Request } from 'express'
import { Arg, Ctx, ID, Mutation, Resolver } from 'type-graphql'
import { badRequest } from 'boom'

import { Subscription } from '@/modules/subscription/subscription.model'
import { Plan } from '@/modules/plan/plan.model'
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
    const plan = await invite.plan()

    await Subscription.subscribeUser(plan, context.session!.user, invite)

    return plan
  }
}
