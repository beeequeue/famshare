import { readFileSync } from 'fs'
import { resolve } from 'path'
import GraphQL from 'express-graphql'
import { makeExecutableSchema } from 'graphql-tools'

import { rootValue } from '@/graphql/resolvers'
import { resolverFunctions } from '@/graphql/validation'
import { IS_DEV } from '@/utils'

const SCHEMA = readFileSync(resolve(__dirname, 'schema.graphql')).toString()

const schema = makeExecutableSchema({
  typeDefs: SCHEMA,
  resolvers: resolverFunctions,
})

export const GraphQLMiddleware = (graphiql = false) =>
  GraphQL({
    schema,
    graphiql,
    pretty: IS_DEV,
    rootValue,
  })
