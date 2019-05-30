/* eslint-disable @typescript-eslint/camelcase */
import { Field, ObjectType, registerEnumType } from 'type-graphql'

import { DatabaseTable, knex, ITableData, ITableOptions } from '@/db'
import { User } from '@/modules/user/user.model'
import { Plan } from '@/modules/plan/plan.model'
import { Invite } from '@/modules/invite/invite.model'
import { isNil } from '@/utils'

const table = () => knex('subscription')

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

interface SubscriptionData {
  plan_uuid: string
  user_uuid: string
  invite_uuid: string
  status: SubscriptionStatus
}

@ObjectType()
export class Subscription extends DatabaseTable {
  @Field(() => Plan)
  public readonly plan!: Plan
  public readonly planUuid: string
  @Field(() => User)
  public readonly user!: User
  public readonly userUuid: string
  @Field(() => Invite)
  public readonly invite!: Invite
  public readonly inviteUuid: string
  @Field(() => SubscriptionStatus)
  public readonly status: SubscriptionStatus

  constructor(options: SubscriptionConstructor) {
    super(options)

    this.planUuid = options.planUuid
    this.userUuid = options.userUuid
    this.inviteUuid = options.inviteUuid
    this.status = options.status
  }

  public static fromSql = (sql: SubscriptionData & ITableData) =>
    new Subscription({
      ...DatabaseTable._fromSql(sql),
      planUuid: sql.plan_uuid,
      userUuid: sql.user_uuid,
      inviteUuid: sql.invite_uuid,
      status: sql.status,
    })

  public static findByUuid = async (
    uuid: string,
  ): Promise<Subscription | null> => {
    const sql = await table()
      .where({ uuid })
      .first()

    if (isNil(sql)) {
      return null
    }

    return Subscription.fromSql(sql)
  }

  public static getByUserUuid = async (
    userUuid: string,
  ): Promise<Subscription[]> => {
    const query: Partial<SubscriptionData> = { user_uuid: userUuid }

    const sql: any[] = await table().where(query)

    return sql.map(Subscription.fromSql)
  }

  public save = async () => {
    const data: SubscriptionData = {
      user_uuid: this.userUuid,
      plan_uuid: this.planUuid,
      invite_uuid: this.inviteUuid,
      status: this.status,
    }

    return this._save(data)
  }
}
