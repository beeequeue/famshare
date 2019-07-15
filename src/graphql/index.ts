import GraphQL from 'express-graphql'
import { printSchema } from 'graphql'
import { buildSchema } from 'type-graphql'

import { ConnectionResolver } from '@/modules/connection/connection.resolvers'
import { InviteResolver } from '@/modules/invite/invite.resolvers'
import { PlanResolver } from '@/modules/plan/plan.resolvers'
import { SubscriptionResolver } from '@/modules/subscription/subscription.resolvers'
import { UserResolver } from '@/modules/user/user.resolvers'
import { authChecker } from '@/modules/session/session.lib'
import { IS_DEV } from '@/utils'

export const createGraphQLMiddleware = async () => {
  const schema = await buildSchema({
    validate: false,
    resolvers: [
      ConnectionResolver,
      InviteResolver,
      PlanResolver,
      SubscriptionResolver,
      UserResolver,
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
        extensions: () => {
          if (process.env.NODE_ENV === 'production') return {}

          return {
            env: process.env.NODE_ENV,
          }
        },
      })
    },
  }
}
