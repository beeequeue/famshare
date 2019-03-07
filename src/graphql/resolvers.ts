import { getUser, getViewer } from '@/modules/user/user.resolvers'

export const rootValue = {
  user: getUser,
  viewer: getViewer,
}
