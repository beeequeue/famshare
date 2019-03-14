import GraphQL from 'express-graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import { rootValue } from '@/graphql/resolvers'
import { resolverFunctions } from '@/graphql/validation'
import { directives } from '@/graphql/directives'
import { IS_DEV } from '@/utils'

const SCHEMA = readFileSync(resolve(__dirname, 'schema.graphql')).toString()

const schema = makeExecutableSchema({
  typeDefs: SCHEMA,
  resolvers: resolverFunctions,
  directiveResolvers: directives,
})

export const GraphQLMiddleware = (graphiql = false) =>
  GraphQL({
    schema,
    graphiql,
    pretty: IS_DEV,
    rootValue,
  })
