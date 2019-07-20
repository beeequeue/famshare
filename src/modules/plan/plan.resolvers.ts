import {
  Arg,
  Ctx,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
} from 'type-graphql'
import { Request } from 'express'
import { forbidden, notFound } from 'boom'

import { Plan } from '@/modules/plan/plan.model'
import { isNil } from '@/utils'

@InputType()
class CreatePlanOptions
  implements Pick<Plan, 'name' | 'amount' | 'paymentDay'> {
  @Field()
  public name!: string

  @Field(() => Int)
  public amount!: number

  @Field(() => Int, {
    description: '1-indexed day in month payments are done.',
  })
  public paymentDay!: number
}

@InputType()
class EditPlanOptions implements Pick<Plan, 'name'> {
  @Field(() => ID)
  public uuid!: string

  @Field({ nullable: true })
  public name!: string
}

@Resolver()
export class PlanResolver {
  @Query(() => Plan, { nullable: true })
  public async plan(@Arg('uuid', () => ID) uuid: string): Promise<Plan | null> {
    return Plan.findByUuid(uuid)
  }

  @Mutation(() => Plan)
  public async createPlan(
    @Arg('options') options: CreatePlanOptions,
    @Ctx() context: Request,
  ): Promise<Plan> {
    const plan = new Plan({
      ...options,
      feeBasisPoints: 10_00,
      ownerUuid: context.session!.user.uuid,
    })

    await plan.save()

    return plan
  }

  @Mutation(() => Plan)
  public async editPlan(
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

  @Mutation(() => ID)
  public async deletePlan(
    @Arg('uuid', () => ID) uuid: string,
    @Ctx() context: Request,
  ): Promise<string> {
    const plan = await Plan.findByUuid(uuid)

    if (isNil(plan)) {
      throw notFound()
    }

    if (plan.ownerUuid !== context.session!.user.uuid) {
      throw forbidden('You are not the owner of this Plan.')
    }

    await plan.delete()

    return uuid
  }
}
