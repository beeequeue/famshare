import { DatabaseTable, knex, TableData, TableOptions } from '@/db'
import { Plan } from '@/modules/plan/plan.model'
import { Invite as IInvite } from '@/graphql/types'
import { isNil } from '@/utils'

const table = () => knex('invite')

export interface InviteConstructor extends TableOptions {
  shortId: string
  cancelled: boolean
  expiresAt: Date
  planUuid: string
}

interface InviteData {
  short_id: string
  cancelled: boolean
  expires_at: Date
  plan_uuid: string
}

export class Invite extends DatabaseTable {
  public readonly shortId: string
  public readonly cancelled: boolean
  public readonly expiresAt: Date
  public readonly planUuid: string

  constructor(options: InviteConstructor) {
    super(options)

    this.shortId = options.shortId
    this.cancelled = options.cancelled
    this.expiresAt = options.expiresAt
    this.planUuid = options.planUuid
  }

  public toGraphQL = async (): Promise<IInvite> => {
    const plan = await Plan.getByUuid(this.planUuid)

    return {
      uuid: this.uuid,
      shortId: this.shortId,
      cancelled: this.cancelled,
      expiresAt: this.expiresAt,
      plan: await plan.toGraphQL(),
      usedBy: null,
      createdAt: this.createdAt,
    }
  }

  public static fromSql = (sql: InviteData & TableData) =>
    new Invite({
      ...DatabaseTable._fromSql(sql),
      shortId: sql.short_id,
      cancelled: sql.cancelled,
      expiresAt: sql.expires_at,
      planUuid: sql.plan_uuid,
    })

  public static findByShortId = async (
    shortId: string,
  ): Promise<Invite | null> => {
    const sql = await table()
      .where({ short_id: shortId })
      .first()

    if (isNil(sql)) {
      return null
    }

    return Invite.fromSql(sql)
  }

  public static getByUuid = async (uuid: string): Promise<Invite> => {
    const query = { uuid }

    const sql = await table()
      .where(query)
      .first()

    if (isNil(sql)) {
      if (!sql) throw new Error(`Could not find Invite:${uuid}`)
    }

    return Invite.fromSql(sql)
  }

  public static getByPlan = async (planUuid: string): Promise<Invite[]> => {
    const query = { plan_uuid: planUuid }

    const sql: Array<TableData & InviteData> = await table().where(query)

    return await sql.map(s => Invite.fromSql(s))
  }

  private static shortIdChars = 'abcdefghijklmnopqrstuvwxyz1234567890'
  public static generateShortId = async (): Promise<string> => {
    const chars = Invite.shortIdChars
    let id = ''

    do {
      id = ''

      for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)]
      }
    } while (await Invite.doesShortIdExist(id))

    return id
  }

  private static doesShortIdExist = async (shortId: string) => {
    const result = await table()
      .count()
      .where({ short_id: shortId })

    return Number(result['count(*)']) === 1
  }

  public save = async () => {
    const data: InviteData = {
      short_id: this.shortId,
      cancelled: this.cancelled,
      expires_at: this.expiresAt,
      plan_uuid: this.planUuid,
    }

    return this._save(data)
  }
}
