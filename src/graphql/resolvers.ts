import { user, viewer, connectStripe } from '@/modules/user/user.resolvers'

export const rootValue = {
  // Query
  user,
  viewer,

  // Mutation
  connectStripe,
}
