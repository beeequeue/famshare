import { Request } from 'express'
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
import { forbidden, notFound } from 'boom'

import { Plan } from '@/modules/plan/plan.model'
import { Invite } from '@/modules/invite/invite.model'

import { isNil } from '@/utils'

@Resolver()
export class InviteResolver {
  @Query(() => Invite)
  public async invite(
    @Arg('uuid', () => ID, { nullable: true }) uuid?: string,
    @Arg('shortId', () => ID, { nullable: true }) shortId?: string,
  ): Promise<Invite> {
    let invite: Invite | null = null

    if (!isNil(uuid)) {
      invite = await Invite.findByUuid(uuid)
    } else if (!isNil(shortId)) {
      invite = await Invite.findByShortId(shortId)
    } else {
      throw new Error('Need to specify `uuid` or `shortId`!')
    }

    if (isNil(invite)) {
      throw notFound()
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

@Resolver(() => Invite)
export class InviteFieldResolver implements ResolverInterface<Invite> {
  @FieldResolver()
  public async plan(@Root() invite: Invite) {
    return Plan.getByUuid(invite.planUuid)
  }

  @FieldResolver()
  public async user(@Root() invite: Invite) {
    return invite.getUserOf()
  }
}
