import { DatabaseTable, knex, TableData, TableOptions } from '@/db'
import { Subscription as ISubscription } from '@/graphql/types'
import { isNil, pick } from '@/utils'

const table = () => knex('subscription')

export interface SubscriptionConstructor extends TableOptions {
  planUuid: string
  userUuid: string
  status: string
}

interface SubscriptionData {
  plan_uuid: string
  user_uuid: string
  status: string
}

export class Subscription extends DatabaseTable {
  public readonly planUuid: string
  public readonly userUuid: string
  public readonly status: string

  constructor(options: SubscriptionConstructor) {
    super(options)

    this.planUuid = options.planUuid
    this.userUuid = options.userUuid
    this.status = options.status
  }

  public toGraphQL = (): ISubscription =>
    pick(this, ['uuid', 'planUuid', 'userUuid', 'createdAt'])

  public static fromSql = (sql: SubscriptionData & TableData) =>
    new Subscription({
      ...DatabaseTable._fromSql(sql),
      planUuid: sql.plan_uuid,
      userUuid: sql.user_uuid,
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
      status: this.status,
    }

    return this._save(data)
  }
}
