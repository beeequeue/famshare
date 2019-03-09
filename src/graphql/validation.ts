import { GraphQLScalarType } from 'graphql'

const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'A ISO-8601 formatted date.',
  serialize(value: Date): string {
    return value.toISOString()
  },
  parseValue(value: string): Date {
    return new Date(value)
  },
  parseLiteral(ast) {
    if (ast.kind === 'StringValue') {
      return new Date(ast.value)
    }

    return null
  },
})

export const resolverFunctions = {
  Date: DateScalar,
}
