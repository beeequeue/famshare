import { notFound } from 'boom'

import { Plan } from '@/modules/plan/plan.model'
import {
  CreatePlanMutationArgs,
  EditPlanMutationArgs,
  Plan as IPlan,
  PlanQueryArgs,
} from '@/graphql/types'
import { isNil, IResolver } from '@/utils'

export const plan: IResolver<IPlan | null, PlanQueryArgs> = async args => {
  const plan = await Plan.findByUuid(args.uuid)

  if (isNil(plan)) {
    throw notFound()
  }

  return await plan.toGraphQL()
}

export const createPlan: IResolver<IPlan, CreatePlanMutationArgs> = async (
  { options },
  context,
) => {
  const plan = new Plan({
    ...options,
    ownerUuid: context.session!.user.uuid,
  })

  await plan.save()

  return plan.toGraphQL()
}

export const editPlan: IResolver<IPlan | null, EditPlanMutationArgs> = async ({
  options,
}) => {
  const plan = await Plan.findByUuid(options.uuid)

  if (isNil(plan)) {
    throw notFound()
  }

  plan.name = options.name || plan.name

  await plan.save()

  return plan.toGraphQL()
}
