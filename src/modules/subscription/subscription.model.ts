/* eslint-disable @typescript-eslint/camelcase */
import { Field, ObjectType, registerEnumType } from 'type-graphql'

import { DatabaseTable, knex, ITableData, ITableOptions } from '@/db'
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
  planUuid: string
  userUuid: string
  inviteUuid: string
  status: SubscriptionStatus
}

interface DatabaseSubscription extends ITableData {
  plan_uuid: string
  user_uuid: string
  invite_uuid: string
  status: SubscriptionStatus
}

@ObjectType()
export class Subscription extends DatabaseTable<DatabaseSubscription> {
  public static readonly table = () =>
    knex<DatabaseSubscription>(Table.SUBSCRIPTION)

  @Field(() => SubscriptionStatus)
  public readonly status: SubscriptionStatus

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

    this.planUuid = options.planUuid
    this.userUuid = options.userUuid
    this.inviteUuid = options.inviteUuid
    this.status = options.status
  }

  public static fromSql = (sql: DatabaseSubscription) =>
    new Subscription({
      ...DatabaseTable._fromSql(sql),
      planUuid: sql.plan_uuid,
      userUuid: sql.user_uuid,
      inviteUuid: sql.invite_uuid,
      status: sql.status,
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

  public async exists() {
    const result = await Subscription.table()
      .count()
      .where({ plan_uuid: this.planUuid, user_uuid: this.userUuid })
      .first()

    return result!['count(*)'] === 1
  }

  public async save() {
    return this._save({
      user_uuid: this.userUuid,
      plan_uuid: this.planUuid,
      invite_uuid: this.inviteUuid,
      status: this.status,
    })
  }
}
