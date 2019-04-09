import { Field, ObjectType, registerEnumType } from 'type-graphql'

import { DatabaseTable, knex, TableData, TableOptions } from '@/db'
import { User } from '@/modules/user/user.model'
import { Plan } from '@/modules/plan/plan.model'
import { Subscription as ISubscription } from '@/graphql/types'
import { isNil } from '@/utils'
import { Invite } from '@/modules/invite/invite.model'

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

export interface SubscriptionConstructor extends TableOptions {
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

  public toGraphQL = async (): Promise<ISubscription> => {
    const [user, plan] = await Promise.all([
      User.getByUuid(this.userUuid),
      Plan.getByUuid(this.planUuid),
    ])

    return {
      uuid: this.uuid,
      user: await user.toGraphQL(),
      plan: await plan.toGraphQL(),
      status: this.status,
      createdAt: this.createdAt,
    }
  }

  public static fromSql = (sql: SubscriptionData & TableData) =>
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
