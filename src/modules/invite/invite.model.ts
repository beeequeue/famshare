import { DatabaseTable, knex, TableData, TableOptions } from '@/db'
import { Invite as IInvite } from '@/graphql/types'
import { isNil } from '@/utils'

const table = () => knex('invite')

export interface InviteConstructor extends TableOptions {
  shortId: string
}

interface InviteData {
  short_id: string
}

export class Invite extends DatabaseTable {
  public readonly shortId: string

  constructor(options: InviteConstructor) {
    super(options)

    this.shortId = options.shortId
  }

  public toGraphQL = async (): Promise<IInvite> => {
    return {
      uuid: this.uuid,
      shortId: this.shortId,
      usedBy: null,
      createdAt: this.createdAt,
    }
  }

  public static fromSql = (sql: InviteData & TableData) =>
    new Invite({
      ...DatabaseTable._fromSql(sql),
      shortId: sql.short_id,
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

  public save = async () => {
    const data: InviteData = {
      short_id: this.shortId,
    }

    return this._save(data)
  }
}
