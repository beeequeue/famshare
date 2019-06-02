import GraphQL from 'express-graphql'
import { printSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import {
  ConnectionFieldResolver,
  ConnectionResolver,
} from '@/modules/connection/connection.resolvers'
import {
  InviteFieldResolver,
  InviteResolver,
} from '@/modules/invite/invite.resolvers'
import { PlanFieldResolver, PlanResolver } from '@/modules/plan/plan.resolvers'
import {
  SubscriptionFieldResolver,
  SubscriptionResolver,
} from '@/modules/subscription/subscription.resolvers'
import { UserFieldResolver, UserResolver } from '@/modules/user/user.resolvers'
import { authChecker } from '@/modules/session/session.lib'
import { IS_DEV } from '@/utils'

export const createGraphQLMiddleware = async () => {
  const schema = await buildSchema({
    resolvers: [
      ConnectionResolver,
      ConnectionFieldResolver,
      InviteResolver,
      InviteFieldResolver,
      PlanResolver,
      PlanFieldResolver,
      SubscriptionResolver,
      SubscriptionFieldResolver,
      UserResolver,
      UserFieldResolver,
    ],
    authChecker,
  })

  return {
    schema: printSchema(schema),
    GraphQLMiddleware: (graphiql = false) => {
      return GraphQL({
        schema,
        graphiql,
        pretty: IS_DEV,
      })
    },
  }
}
