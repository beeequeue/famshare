import { Request } from 'express'
import { Arg, Ctx, ID, Mutation, Query, Resolver } from 'type-graphql'
import { forbidden, notFound } from 'boom'

import { Plan } from '@/modules/plan/plan.model'
import { Invite } from '@/modules/invite/invite.model'

import { isNil } from '@/utils'

@Resolver()
export class InviteResolver {
  @Query(() => Invite, { nullable: true })
  public async invite(
    @Arg('uuid', () => ID, { nullable: true }) uuid?: string,
    @Arg('shortId', () => ID, { nullable: true }) shortId?: string,
  ): Promise<Invite | null> {
    let invite: Invite | null = null

    if (!isNil(uuid)) {
      invite = await Invite.findByUuid(uuid)
    } else if (!isNil(shortId)) {
      invite = await Invite.findByShortId(shortId)
    } else {
      throw new Error('Need to specify `uuid` or `shortId`!')
    }

    return invite
  }

  @Mutation(() => Invite)
  public async createInvite(
    @Arg('planUuid', () => ID) planUuid: string,
    @Arg('expiresAt', () => Date) expiresAt: Date,
    @Ctx() context: Request,
  ): Promise<Plan> {
    const plan = await Plan.findByUuid(planUuid)

    if (isNil(plan)) {
      throw notFound()
    }

    if (plan.ownerUuid !== context.session!.user.uuid) {
      throw forbidden('You are not the owner of this Plan.')
    }

    await plan.createInvite(expiresAt)

    return plan
  }
}
