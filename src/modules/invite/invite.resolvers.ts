import { Request } from 'express'
import { Arg, Ctx, Mutation, Resolver } from 'type-graphql'
import { forbidden, notFound } from 'boom'
import { Plan } from '@/modules/plan/plan.model'
import { CreateInviteMutationArgs, Plan as IPlan } from '@/graphql/types'
import { isNil } from '@/utils'

@Resolver()
export class InviteResolver {
  @Mutation()
  async createInvite(
    @Arg('planUuid') planUuid: CreateInviteMutationArgs['planUuid'],
    @Arg('expiresAt') expiresAt: CreateInviteMutationArgs['expiresAt'],
    @Ctx() context: Request,
  ): Promise<IPlan> {
    const plan = await Plan.findByUuid(planUuid)

    if (isNil(plan)) {
      throw notFound()
    }

    if (plan.ownerUuid !== context.session!.user.uuid) {
      throw forbidden('You are not the owner of this Plan.')
    }

    await plan.createInvite(expiresAt)

    return plan.toGraphQL()
  }
}
