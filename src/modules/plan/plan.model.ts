/* eslint-disable @typescript-eslint/camelcase */
import { Field, Int, ObjectType } from 'type-graphql'
import { addMonths, isAfter, setDate } from 'date-fns'

import { DatabaseTable, knex, ITableData, ITableOptions } from '@/db'
import { User } from '@/modules/user/user.model'
import { Invite } from '@/modules/invite/invite.model'
import {
  Subscription,
  SubscriptionStatus,
} from '@/modules/subscription/subscription.model'
import { Table } from '@/constants'

interface Constructor extends ITableOptions {
  name: string
  paymentDay: number
  amount: number
  ownerUuid: string
}

interface DatabasePlan extends ITableData {
  name: string
  payment_day: number
  amount: number
  owner_uuid: string
}

@ObjectType()
export class Plan extends DatabaseTable<DatabasePlan> {
  public static readonly table = () => knex<DatabasePlan>(Table.PLAN)

  @Field()
  public name: string
  @Field(() => Int)
  public readonly amount: number
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
  public readonly owner!: User
  public readonly ownerUuid: string
  public getOwner = async () => User.getByUuid(this.ownerUuid)

  @Field(() => [User])
  public readonly members!: User[]
  public getMembers = async () => {
    const results: any[] = await knex(Table.USER)
      .select('user.*')
      .innerJoin(Table.SUBSCRIPTION, function() {
        this.on('user.uuid', '=', 'subscription.user_uuid')
      })
      .where({ 'subscription.uuid': this.uuid })

    return results.map(result => User.fromSql(result))
  }

  constructor(options: Constructor) {
    super(options)

    this.name = options.name
    this.amount = options.amount
    this.paymentDay = options.paymentDay
    this.ownerUuid = options.ownerUuid
  }

  public static fromSql(sql: DatabasePlan & ITableData) {
    return new Plan({
      ...DatabaseTable._fromSql(sql),
      name: sql.name,
      amount: sql.amount,
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

  public async createInvite(expiresAt: Date) {
    const shortId = await Invite.generateShortId()

    const invite = new Invite({
      shortId,
      cancelled: false,
      expiresAt,
      planUuid: this.uuid,
    })

    await invite.save()

    return invite
  }

  public async subscribeUser(userUuid: string, inviteUuid: string) {
    const subscription = new Subscription({
      planUuid: this.uuid,
      userUuid,
      inviteUuid,
      status: SubscriptionStatus.JOINED,
    })

    await subscription.save()

    return subscription
  }

  public async save() {
    return this._save({
      name: this.name,
      amount: this.amount,
      payment_day: this.paymentDay,
      owner_uuid: this.ownerUuid,
    })
  }
}
