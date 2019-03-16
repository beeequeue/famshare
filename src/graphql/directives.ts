import { GraphqlRequest } from 'express'
import { forbidden, unauthorized } from 'boom'
import { DirectiveResolverFn, IDirectiveResolvers } from 'graphql-tools'

import { Plan } from '@/modules/plan/plan.model'
import { AccessLevel, AuthLevel } from '@/graphql/types'
import { IS_NOT_PLAN_OWNER, NOT_LOGGED_IN } from '@/errors'
import { isNil } from '@/utils'

const RestrictDirective: DirectiveResolverFn<any, GraphqlRequest> = async (
  next,
  _source,
  args,
  context,
) => {
  const { level: requiredLevel } = args as { level: AuthLevel }

  if (isNil(context.session)) {
    throw forbidden(NOT_LOGGED_IN)
  }

  const { user } = context.session

  if (user.accessLevel === AccessLevel.ADMIN) {
    return next()
  }

  if (requiredLevel === AuthLevel.PLAN_OWNER) {
    const { uuid } = context.body.variables.options
    const { ownerUuid } = await Plan.getByUuid(uuid)

    if (context.session.user.uuid !== ownerUuid) {
      throw unauthorized(IS_NOT_PLAN_OWNER)
    }
  }
}

const IsAuthedDirective: DirectiveResolverFn<any, GraphqlRequest> = async (
  _next,
  _source,
  _args,
  context,
) => {
  const isLoggedIn = !isNil(context.session)

  if (!isLoggedIn) {
    throw forbidden(NOT_LOGGED_IN)
  }
}

export const directives: IDirectiveResolvers<any, GraphqlRequest> = {
  restrict: RestrictDirective,
  isAuthed: IsAuthedDirective,
}
