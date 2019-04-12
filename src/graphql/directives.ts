import { Request } from 'express'
import { defaultFieldResolver, GraphQLField, GraphQLObjectType } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import { AccessLevel } from '@/modules/user/user.model'
import { isNil } from '@/utils'

declare module 'graphql' {
  // eslint-disable-next-line @typescript-eslint/interface-name-prefix
  interface GraphQLObjectType {
    _authFieldsWrapped?: boolean
    _requiredAuthLevel?: AuthLevel
  }
  // eslint-disable-next-line @typescript-eslint/interface-name-prefix
  interface GraphQLField<TSource, TContext, TArgs = { [key: string]: any }> {
    _requiredAuthLevel?: AuthLevel
  }
}

export enum AuthLevel {
  ADMIN = 'ADMIN',
}

type GqlObject = GraphQLObjectType<null, Request>
type GqlField = GraphQLField<any, Request>

export class AuthDirective extends SchemaDirectiveVisitor {
  public visitObject(type: GqlObject) {
    type._requiredAuthLevel = this.args.level

    this.ensureIsNullable(type)
    this.ensureFieldsWrapped(type)
  }

  public visitFieldDefinition(
    field: GqlField,
    details: { objectType: GqlObject },
  ) {
    field._requiredAuthLevel = this.args.level

    this.ensureIsNullable(field)
    this.ensureFieldsWrapped(details.objectType)
  }

  public ensureIsNullable = (type: GqlField | GqlObject) => {
    const notNullableMessage = `It seems that the field ${
      type.name
    } is restricted, but is not nullable.`

    if (isNil(type.astNode)) {
      console.warn(notNullableMessage)
      return false
    }

    if (type.astNode.kind === 'ObjectTypeDefinition') {
      // TODO
    } else if (type.astNode.type.kind === 'NonNullType') {
      console.warn(notNullableMessage)
      return false
    }
  }

  public ensureFieldsWrapped = (objectType: GqlObject) => {
    if (objectType._authFieldsWrapped) return
    objectType._authFieldsWrapped = true

    const fields = objectType.getFields()

    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName]
      const { resolve = defaultFieldResolver } = field

      field.resolve = async (...args) => {
        const requiredLevel =
          field._requiredAuthLevel || objectType._requiredAuthLevel

        if (!requiredLevel) {
          return resolve.apply(this, args)
        }

        const context = args[2]
        if (isNil(context.session)) {
          return null
        }

        const { user } = context.session

        if (user.accessLevel !== AccessLevel.ADMIN) {
          return null
        }
      }
    })
  }
}

export const directives = {
  restrict: AuthDirective,
}
