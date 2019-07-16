/* eslint-disable @typescript-eslint/camelcase */
import { Field, Int, ObjectType } from 'type-graphql'
import { addMonths, isAfter, setDate } from 'date-fns'

import { DatabaseTable, ITableData, ITableOptions, knex } from '@/db'
import { stripe } from '@/modules/stripe/stripe.lib'
import { User } from '@/modules/user/user.model'
import { Invite } from '@/modules/invite/invite.model'
import { Table } from '@/constants'

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
/*
 * fees and payments
 */
@ObjectType()
export class Plan extends DatabaseTable<DatabasePlan> {
  public static readonly table = () => knex<DatabasePlan>(Table.PLAN)

  @Field()
  public name: string
  @Field(() => Int)
  public readonly amount: number
  @Field(() => Int)
  public readonly feeBasisPoints: number
  @Field(() => Int, {
    description: '1-indexed day in month payments are done.',
  })
  public readonly paymentDay: number
  @Field(() => Date, {
    description: 'The date the next payment will be attempted.',
  })
  public nextPaymentDate() {
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

  @Field(() => [User])
  public async members(): Promise<User[]> {
    const results: any[] = await knex(Table.USER)
      .select('user.*')
      .innerJoin(Table.SUBSCRIPTION, function() {
        this.on('user.uuid', '=', 'subscription.user_uuid')
      })
      .where({ 'subscription.plan_uuid': this.uuid })

    return results.map(result => User.fromSql(result))
  }

  @Field(() => [Invite])
  public async invites(): Promise<Invite[]> {
    return Invite.findByPlan(this.uuid)
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

  private async registerToStripe() {
    const product = await stripe.products.create({
      id: this.uuid,
      name: this.name,
      type: 'service',
      statement_descriptor: `famshare-${this.name.toUpperCase().substr(0, 10)}`,
    })

    await stripe.plans.create({
      id: this.uuid,
      product: product.id,
      nickname: this.name,
      currency: 'eur',
      interval: 'month',
      usage_type: 'licensed',
      billing_scheme: 'per_unit',
      amount: this.amount,
    })
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
        await this.registerToStripe()
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
}
