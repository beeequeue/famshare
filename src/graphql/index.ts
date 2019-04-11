import GraphQL from 'express-graphql'
import { printSchema } from 'graphql'
import { buildTypeDefsAndResolvers } from 'type-graphql'
import { makeExecutableSchema } from 'graphql-tools'

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
import { directives } from '@/graphql/directives'
import { IS_DEV } from '@/utils'

export const createGraphQLMiddleware = async () => {
  const { typeDefs, resolvers } = await buildTypeDefsAndResolvers({
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
  })

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    schemaDirectives: directives,
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
