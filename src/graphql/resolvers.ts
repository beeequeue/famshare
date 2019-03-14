import { connectStripe, user, viewer } from '@/modules/user/user.resolvers'
import { createPlan, editPlan, plan } from '@/modules/plan/plan.resolvers'

export const rootValue = {
  // Query
  user,
  viewer,
  plan,

  // Mutation
  connectStripe,
  createPlan,
  editPlan,
}
