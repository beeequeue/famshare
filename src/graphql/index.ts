import GraphQL from 'express-graphql'
import { buildTypeDefsAndResolvers } from 'type-graphql'
import { makeExecutableSchema, mergeSchemas } from 'graphql-tools'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import {
  InviteFieldResolver,
  InviteResolver,
} from '@/modules/invite/invite.resolvers'
import {
  SubscriptionFieldResolver,
  SubscriptionResolver,
} from '@/modules/subscription/subscription.resolvers'
import { PlanFieldResolver, PlanResolver } from '@/modules/plan/plan.resolvers'
import { resolverFunctions } from '@/graphql/validation'
import { directives } from '@/graphql/directives'
import { IS_DEV } from '@/utils'

const SCHEMA = readFileSync(resolve(__dirname, 'schema.graphql')).toString()

export const GraphQLMiddleware = async (graphiql = false) => {
  const { typeDefs, resolvers } = await buildTypeDefsAndResolvers({
    resolvers: [
      InviteResolver,
      InviteFieldResolver,
      SubscriptionResolver,
      SubscriptionFieldResolver,
      PlanResolver,
      PlanFieldResolver,
    ],
  })

  const oldSchema = makeExecutableSchema({
    typeDefs: SCHEMA,
    resolvers: resolverFunctions,
    schemaDirectives: directives,
  })

  const newSchema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  return GraphQL({
    schema: mergeSchemas({ schemas: [oldSchema, newSchema] }),
    graphiql,
    pretty: IS_DEV,
  })
}
