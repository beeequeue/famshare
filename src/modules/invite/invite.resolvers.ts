import { forbidden, notFound } from 'boom'
import { Plan } from '@/modules/plan/plan.model'
import { CreateInviteMutationArgs, Plan as IPlan } from '@/graphql/types'
import { isNil, Resolver } from '@/utils'

export const createInvite: Resolver<
  IPlan | null,
  CreateInviteMutationArgs
> = async (args, request) => {
  const plan = await Plan.findByUuid(args.planUuid)

  if (isNil(plan)) {
    throw notFound()
  }

  if (plan.ownerUuid !== request.session!.user.uuid) {
    throw forbidden('You are not the owner of this Plan.')
  }

  await plan.createInvite(args.expiresAt)

  return plan.toGraphQL()
}
