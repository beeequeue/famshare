import GraphQL from 'express-graphql'
import { buildTypeDefsAndResolvers } from 'type-graphql'
import { makeExecutableSchema } from 'graphql-tools'

import {
  InviteFieldResolver,
  InviteResolver,
} from '@/modules/invite/invite.resolvers'
import {
  SubscriptionFieldResolver,
  SubscriptionResolver,
} from '@/modules/subscription/subscription.resolvers'
import { PlanFieldResolver, PlanResolver } from '@/modules/plan/plan.resolvers'
import {
  ConnectionFieldResolver,
  ConnectionResolver,
} from '@/modules/connection/connection.resolvers'
import { directives } from '@/graphql/directives'
import { IS_DEV } from '@/utils'

export const GraphQLMiddleware = async (graphiql = false) => {
  const { typeDefs, resolvers } = await buildTypeDefsAndResolvers({
    resolvers: [
      InviteResolver,
      InviteFieldResolver,
      SubscriptionResolver,
      SubscriptionFieldResolver,
      PlanResolver,
      PlanFieldResolver,
      ConnectionResolver,
      ConnectionFieldResolver,
    ],
  })

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
    schemaDirectives: directives,
  })

  return GraphQL({
    schema,
    graphiql,
    pretty: IS_DEV,
  })
}
