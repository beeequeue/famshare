import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  ID,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  ResolverInterface,
  Root,
} from 'type-graphql'
import { Request } from 'express'
import { forbidden, notFound } from 'boom'

import { Plan } from '@/modules/plan/plan.model'
import { isNil } from '@/utils'

@InputType()
class CreatePlanOptions implements Partial<Plan> {
  @Field()
  name!: string

  @Field(() => Int)
  amount!: number

  @Field(() => Int, {
    description: '1-indexed day in month payments are done.',
  })
  paymentDay!: number
}

@InputType()
class EditPlanOptions implements Partial<Plan> {
  @Field(() => ID)
  uuid!: string

  @Field({ nullable: true })
  name!: string
}

@Resolver()
export class PlanResolver {
  @Query(() => Plan)
  async plan(@Arg('uuid', () => ID) uuid: string) {
    const plan = await Plan.findByUuid(uuid)

    if (isNil(plan)) {
      throw notFound()
    }

    return plan
  }

  @Mutation(() => Plan)
  async createPlan(
    @Arg('options') options: CreatePlanOptions,
    @Ctx() context: Request,
  ): Promise<Plan> {
    const plan = new Plan({
      ...options,
      ownerUuid: context.session!.user.uuid,
    })

    await plan.save()

    return plan
  }

  @Mutation(() => Plan)
  async editPlan(
    @Arg('options') options: EditPlanOptions,
    @Ctx() context: Request,
  ): Promise<Plan> {
    const plan = await Plan.findByUuid(options.uuid)

    if (isNil(plan)) {
      throw notFound()
    }

    if (plan.ownerUuid !== context.session!.user.uuid) {
      throw forbidden('You are not the owner of this Plan.')
    }

    plan.name = options.name || plan.name

    await plan.save()

    return plan
  }
}

@Resolver(() => Plan)
export class PlanFieldResolver implements ResolverInterface<Plan> {
  @FieldResolver()
  async owner(@Root() plan: Plan) {
    return await plan.getOwner()
  }

  @FieldResolver()
  async members(@Root() plan: Plan) {
    return await plan.getMembers()
  }
}
