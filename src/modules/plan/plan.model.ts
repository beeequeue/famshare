/* eslint-disable @typescript-eslint/camelcase */
import { Request } from 'express'
import { Ctx, Field, Int, ObjectType } from 'type-graphql'
import { addMonths, isAfter, setDate } from 'date-fns'

import { DatabaseTable, ITableData, ITableOptions, knex } from '@/db'
import { stripe } from '@/modules/stripe/stripe.lib'
import { User } from '@/modules/user/user.model'
import { Invite } from '@/modules/invite/invite.model'
import {
  PayingSubscriptionStatuses,
  Subscription,
} from '@/modules/subscription/subscription.model'
import { Table } from '@/constants'
import { isNil, unBasisPoints } from '@/utils'

interface Constructor extends ITableOptions {
  name: string
  amount: number
  feeBasisPoints: number
  paymentDay: number
  ownerUuid: string
}

interface DatabasePlan extends ITableData {
  name: string
  amount: number
  fee_basis_points: number
  payment_day: number
  owner_uuid: string
}

@ObjectType()
export class Plan extends DatabaseTable<DatabasePlan> {
  public static readonly table = () => knex<DatabasePlan>(Table.PLAN)

  @Field()
  public name: string
  @Field(() => Int)
  public readonly amount: number
  @Field(() => Int)
  public readonly feeBasisPoints: number
  @Field(() => Int)
  public async splitAmount(): Promise<number> {
    return this.getPaymentAmount((await this.members()).length)
  }

  @Field(() => Int, {
    description: '1-indexed day in month payments are done.',
  })
  public readonly paymentDay: number
  @Field(() => Date, {
    description: 'The date the next payment will be attempted.',
  })
  public nextPaymentDate(): Date {
    let nextPaymentDate = setDate(new Date(), this.paymentDay)

    if (isAfter(new Date(), nextPaymentDate)) {
      nextPaymentDate = addMonths(nextPaymentDate, 1)
    }

    return nextPaymentDate
  }

  @Field(() => User)
  public async owner(): Promise<User> {
    return User.getByUuid(this.ownerUuid)
  }
  public readonly ownerUuid: string

  @Field(() => [Subscription])
  public async subscriptions(): Promise<Subscription[]> {
    return Subscription.getByPlan(this)
  }

  @Field(() => [User])
  public async members(): Promise<User[]> {
    const results: any[] = await knex(Table.USER)
      .select('user.*')
      .innerJoin(Table.SUBSCRIPTION, function() {
        this.on('user.uuid', '=', 'subscription.user_uuid')
      })
      .where({ 'subscription.plan_uuid': this.uuid })
      .whereIn('subscription.status', PayingSubscriptionStatuses)

    return results.map(result => User.fromSql(result))
  }

  @Field(() => [Invite])
  public async invites(): Promise<Invite[]> {
    return Invite.findByPlan(this.uuid)
  }

  @Field(() => Boolean)
  public async isSubscribed(@Ctx() context: Request): Promise<boolean> {
    const sessionUserUuid = context.session!.user.uuid
    if (this.ownerUuid === sessionUserUuid) return true

    return !isNil(
      (await this.members()).find(user => user.uuid === sessionUserUuid),
    )
  }

  constructor(options: Constructor) {
    super(options)

    this.name = options.name
    this.amount = options.amount
    this.feeBasisPoints = options.feeBasisPoints
    this.paymentDay = options.paymentDay
    this.ownerUuid = options.ownerUuid
  }

  public static fromSql(sql: DatabasePlan) {
    return new Plan({
      ...DatabaseTable._fromSql(sql),
      name: sql.name,
      amount: sql.amount,
      feeBasisPoints: sql.fee_basis_points,
      paymentDay: sql.payment_day,
      ownerUuid: sql.owner_uuid,
    })
  }

  public static async findByUuid(uuid: string) {
    const plan = await this.table()
      .where({ uuid })
      .first()

    if (!plan) return null

    return Plan.fromSql(plan)
  }

  public static async getByUuid(uuid: string) {
    const plan = await this.table()
      .where({ uuid })
      .first()

    if (!plan) throw new Error(`Could not find Plan:${uuid}`)

    return Plan.fromSql(plan)
  }

  public static async getByOwnerUuid(uuid: string) {
    const plan = await this.table().where({ owner_uuid: uuid })

    return plan.map(Plan.fromSql)
  }

  private getStripePlanOptions(amount: number) {
    return {
      id: this.uuid,
      product: this.uuid,
      nickname: this.name,
      currency: 'eur',
      interval: 'month',
      usage_type: 'licensed',
      billing_scheme: 'per_unit',
      amount: amount,
    } as const
  }

  private async registerToStripe(amount: number) {
    await stripe.products.create({
      id: this.uuid,
      name: this.name,
      type: 'service',
      statement_descriptor: `famshare-${this.name.toUpperCase().substr(0, 10)}`,
    })

    await stripe.plans.create(this.getStripePlanOptions(amount))
  }

  public getPaymentAmount(members: number) {
    // Members + owner
    const nominator = members + 1

    return Math.round(
      (this.amount / nominator) * (unBasisPoints(this.feeBasisPoints) + 1),
    )
  }

  public async updateStripePlan(type: 'add' | 'remove') {
    const members = await this.members()

    const newMemberAmount = members + type === 'add' ? 1 : -1
    const oldAmount = this.getPaymentAmount(members.length)
    const newAmount = this.getPaymentAmount(newMemberAmount)

    await stripe.plans.del(this.uuid)

    try {
      await stripe.plans.create(this.getStripePlanOptions(newAmount))
    } catch (e) {
      await stripe.plans.create(this.getStripePlanOptions(oldAmount))
    }
  }

  public async createInvite(expiresAt: Date) {
    const invite = new Invite({
      shortId: await Invite.generateShortId(),
      cancelled: false,
      expiresAt,
      planUuid: this.uuid,
    })

    await invite.save()

    return invite
  }

  public async save() {
    if (!(await this.exists())) {
      try {
        await this.registerToStripe(this.getPaymentAmount(0))
      } catch (e) {
        throw new Error('Could not create Stripe Product and Plan.')
      }
    }

    return this._save({
      name: this.name,
      amount: this.amount,
      fee_basis_points: this.feeBasisPoints,
      payment_day: this.paymentDay,
      owner_uuid: this.ownerUuid,
    })
  }

  public async delete() {
    const subscriptions = await this.subscriptions()
    await Promise.all(
      subscriptions.map(sub => stripe.subscriptions.del(sub.stripeId)),
    )

    await stripe.plans.del(this.uuid)
    await stripe.products.del(this.uuid)

    return super.delete()
  }
}
