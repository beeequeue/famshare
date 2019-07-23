import { Request } from 'express'
import { Arg, Ctx, ID, Mutation, Resolver } from 'type-graphql'
import { badRequest } from 'boom'

import { Subscription } from '@/modules/subscription/subscription.model'
import { Plan } from '@/modules/plan/plan.model'
import { Invite } from '@/modules/invite/invite.model'
import { isNil } from '@/utils'
import { PLAN_NOT_FOUND } from '@/errors'

@Resolver()
export class SubscriptionResolver {
  @Mutation(() => Subscription)
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

  @Mutation(() => ID)
  public async unsubscribe(
    @Arg('planUuid', () => ID) planUuid: string,
    @Arg('userUuid', () => ID, { nullable: true }) userUuid: string | null,
    @Ctx() context: Request,
  ) {
    if (isNil(userUuid)) {
      userUuid = context.session!.user.uuid
    }

    const plan = await Plan.findByUuid(planUuid)
    if (isNil(plan)) {
      throw new Error(PLAN_NOT_FOUND)
    }

    const subscriptions = await plan.subscriptions()
    const subscription = subscriptions.find(
      subscription => subscription.userUuid === userUuid,
    )
    if (isNil(subscription)) {
      throw new Error('User is not subscribed to this plan.')
    }

    const isOwnerOfSubscription = userUuid === context.session!.user.uuid
    const isOwnerOfPlan = plan.ownerUuid === context.session!.user.uuid
    const isAllowedToUnsubscribeUser = isOwnerOfSubscription || isOwnerOfPlan
    if (!isAllowedToUnsubscribeUser) {
      throw new Error('You are not allowed to unsubscribe this User.')
    }

    await subscription.delete()

    return subscription.uuid
  }
}
