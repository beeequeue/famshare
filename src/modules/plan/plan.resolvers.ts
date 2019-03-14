import { Plan } from '@/modules/plan/plan.model'
import { Plan as IPlan, PlanQueryArgs } from '@/graphql/types'
import { isNil, Resolver } from '@/utils'

export const plan: Resolver<IPlan | null, PlanQueryArgs> = async args => {
  const plan = await Plan.findByUuid(args.uuid)

  if (isNil(plan)) {
    return null
  }

  return await plan.toGraphQL()
}
