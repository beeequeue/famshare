import { Plan } from '@/modules/plan/plan.model'
import {
  CreatePlanMutationArgs,
  EditPlanMutationArgs,
  Plan as IPlan,
  PlanQueryArgs,
} from '@/graphql/types'
import { isNil, Resolver } from '@/utils'

export const plan: Resolver<IPlan | null, PlanQueryArgs> = async args => {
  const plan = await Plan.findByUuid(args.uuid)

  if (isNil(plan)) {
    return null
  }

  return await plan.toGraphQL()
}

export const createPlan: Resolver<IPlan, CreatePlanMutationArgs> = async (
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

export const editPlan: Resolver<IPlan | null, EditPlanMutationArgs> = async ({
  options,
}) => {
  const plan = await Plan.findByUuid(options.uuid)

  if (isNil(plan)) {
    return null
  }

  plan.name = options.name || plan.name

  await plan.save()

  return plan.toGraphQL()
}
