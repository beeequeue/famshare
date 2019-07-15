/* eslint-disable @typescript-eslint/camelcase */
import { Field, ObjectType, registerEnumType } from 'type-graphql'

import { DatabaseTable, knex, ITableData, ITableOptions } from '@/db'
import { stripe } from '@/modules/stripe/stripe.lib'
import { User } from '@/modules/user/user.model'
import { Plan } from '@/modules/plan/plan.model'
import { Invite } from '@/modules/invite/invite.model'
import { isNil } from '@/utils'
import { Table } from '@/constants'

export enum SubscriptionStatus {
  INVITED = 'INVITED',
  JOINED = 'JOINED',
  ACTIVE = 'ACTIVE',
  LATE = 'LATE',
  EXPIRED = 'EXPIRED',
  EXEMPTED = 'EXEMPTED',
}

registerEnumType(SubscriptionStatus, {
  name: 'SubscriptionStatus',
})

export interface SubscriptionConstructor extends ITableOptions {
  status: SubscriptionStatus
  stripeId?: string
  planUuid: string
  userUuid: string
  inviteUuid: string
}

interface DatabaseSubscription extends ITableData {
  status: SubscriptionStatus
  stripe_id: string
  plan_uuid: string
  user_uuid: string
  invite_uuid: string
}

@ObjectType()
export class Subscription extends DatabaseTable<DatabaseSubscription> {
  public static readonly table = () =>
    knex<DatabaseSubscription>(Table.SUBSCRIPTION)

  @Field(() => SubscriptionStatus)
  public readonly status: SubscriptionStatus

  public stripeId!: string

  @Field(() => Plan)
  public async plan(): Promise<Plan> {
    return Plan.getByUuid(this.planUuid)
  }
  public readonly planUuid: string

  @Field(() => User)
  public async user(): Promise<User> {
    return User.getByUuid(this.userUuid)
  }
  public readonly userUuid: string

  @Field(() => Invite)
  public async invite(): Promise<Invite> {
    return Invite.getByUuid(this.inviteUuid)
  }
  public readonly inviteUuid: string

  constructor(options: SubscriptionConstructor) {
    super(options)

    this.status = options.status
    this.stripeId = options.stripeId!
    this.planUuid = options.planUuid
    this.userUuid = options.userUuid
    this.inviteUuid = options.inviteUuid
  }

  public static fromSql = (sql: DatabaseSubscription) =>
    new Subscription({
      ...DatabaseTable._fromSql(sql),
      status: sql.status,
      stripeId: sql.stripe_id,
      planUuid: sql.plan_uuid,
      userUuid: sql.user_uuid,
      inviteUuid: sql.invite_uuid,
    })

  public static async findByUuid(uuid: string): Promise<Subscription | null> {
    const sql = await this.table()
      .where({ uuid })
      .first()

    if (isNil(sql)) {
      return null
    }

    return Subscription.fromSql(sql)
  }

  public static async getByUserUuid(userUuid: string): Promise<Subscription[]> {
    const sql = await this.table().where({ user_uuid: userUuid })

    return sql.map(Subscription.fromSql)
  }

  private async registerToStripe() {
    const user = await this.user()
    const plan = await this.plan()

    const stripeSub = await stripe.subscriptions.create({
      metadata: {
        uuid: this.uuid,
      },
      customer: user.stripeId!,
      items: [{ plan: this.planUuid }],
      billing: 'charge_automatically',
      prorate: false,
      billing_cycle_anchor: Math.round(plan.nextPaymentDate().getTime() / 1000),
    })

    this.stripeId = stripeSub.id
  }

  public async exists() {
    const result = await Subscription.table()
      .count()
      .where({ plan_uuid: this.planUuid, user_uuid: this.userUuid })
      .first()

    return result!['count(*)'] === 1
  }

  public async save() {
    if (!(await this.exists())) {
      try {
        await this.registerToStripe()
      } catch (e) {
        console.error(e)
        throw new Error('Could not create stripe Subscription!')
      }
    }

    return this._save({
      user_uuid: this.userUuid,
      plan_uuid: this.planUuid,
      invite_uuid: this.inviteUuid,
      stripe_id: this.stripeId,
      status: this.status,
    })
  }
}
