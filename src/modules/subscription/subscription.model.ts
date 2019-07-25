/* eslint-disable @typescript-eslint/camelcase */
import { Field, ObjectType, registerEnumType } from 'type-graphql'

import { DatabaseTable, ITableData, ITableOptions, knex } from '@/db'
import { stripe } from '@/modules/stripe/stripe.lib'
import { User } from '@/modules/user/user.model'
import { Plan } from '@/modules/plan/plan.model'
import { Invite } from '@/modules/invite/invite.model'
import { isNil } from '@/utils'
import { Table } from '@/constants'
import { INVITE_ALREADY_USED, OWNER_OF_PLAN_SUBSCRIBE } from '@/errors'

export enum SubscriptionStatus {
  INVITED = 'INVITED',
  JOINED = 'JOINED',
  ACTIVE = 'ACTIVE',
  LATE = 'LATE',
  EXPIRED = 'EXPIRED',
  EXEMPTED = 'EXEMPTED',
  CANCELLED = 'CANCELLED',
}

export const PayingSubscriptionStatuses = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.JOINED,
  SubscriptionStatus.LATE,
]

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
  public status: SubscriptionStatus

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

  public static async getByPlan(plan: Plan): Promise<Subscription[]> {
    const sql = await this.table().where({ plan_uuid: plan.uuid })

    return sql.map(this.fromSql)
  }

  public static async subscribeUser(plan: Plan, user: User, invite: Invite) {
    if (user.uuid === plan.ownerUuid) {
      throw new Error(OWNER_OF_PLAN_SUBSCRIBE)
    }

    const isClaimed = !isNil(await invite.user())
    if (isClaimed) {
      throw new Error(INVITE_ALREADY_USED)
    }

    const subscription = new Subscription({
      planUuid: plan.uuid,
      userUuid: user.uuid,
      inviteUuid: invite.uuid,
      status: SubscriptionStatus.JOINED,
    })

    await plan.updateStripePlan('add')

    await subscription.save()

    return subscription
  }

  public static shouldPay(subscription: Subscription) {
    return PayingSubscriptionStatuses.includes(subscription.status)
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

  private async _setStatus(status: SubscriptionStatus) {
    await Subscription.table()
      .update({ status })
      .where({ uuid: this.uuid })

    this.status = status
  }

  /**
   *  Excludes cancel status, use .cancel() instead.
   */
  public async setStatus(
    status: Exclude<SubscriptionStatus, SubscriptionStatus.CANCELLED>,
  ) {
    return this._setStatus(status)
  }

  public async cancel() {
    const plan = await this.plan()

    await stripe.subscriptions.del(this.stripeId)
    await plan.updateStripePlan('remove')

    return this._setStatus(SubscriptionStatus.CANCELLED)
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
