import { getUser, getViewer } from '@/modules/user/user.graphql'

export const rootValue = {
  user: getUser,
  viewer: getViewer,
}
