import { DatabaseTable, knex, TableData, TableOptions } from '@/db'
import { ConnectionType, Connection as IConnection } from '@/graphql/types'
import { isNil } from '@/utils'

const table = () => knex('connection')

export interface ConnectionConstructor extends TableOptions {
  type: ConnectionType
  ownerUuid: string
  userId: string
  identifier: string
  picture?: string
  link?: string
}

interface ConnectionData {
  type: string
  owner_uuid: string
  user_id: string
  identifier: string
  picture?: string
  link?: string
}

export class Connection extends DatabaseTable {
  public readonly type: ConnectionType
  public readonly ownerUuid: string
  public readonly userId: string
  public readonly identifier: string
  public readonly picture?: string
  public readonly link?: string

  constructor(options: ConnectionConstructor) {
    super(options)

    this.type = options.type
    this.ownerUuid = options.ownerUuid
    this.userId = options.userId
    this.identifier = options.identifier
    this.picture = options.picture
    this.link = options.link
  }

  public toGraphQL = (): IConnection => ({
    uuid: this.uuid,
    type: this.type,
    ownerUuid: this.ownerUuid,
    userId: this.userId,
    identifier: this.identifier,
    picture: this.picture,
    link: this.link,
    createdAt: this.createdAt,
  })

  public static fromSql = (sql: ConnectionData & TableData) =>
    new Connection({
      ...DatabaseTable._fromSql(sql),
      type: sql.type as ConnectionType,
      ownerUuid: sql.owner_uuid,
      userId: sql.user_id,
      identifier: sql.identifier,
      picture: sql.picture,
      link: sql.link,
    })

  public static findByUuid = async (
    uuid: string,
  ): Promise<Connection | null> => {
    const sql = await table()
      .where({ uuid })
      .first()

    if (isNil(sql)) {
      return null
    }

    return Connection.fromSql(sql)
  }

  public static getByUserUuid = async (
    ownerUuid: string,
  ): Promise<Connection[]> => {
    const query: any = { owner_uuid: ownerUuid }

    const sql: any[] = await table().where(query)

    return sql.map(Connection.fromSql)
  }

  public save = async () => {
    const data: ConnectionData = {
      type: this.type,
      owner_uuid: this.ownerUuid,
      user_id: this.userId,
      identifier: this.identifier,
      picture: this.picture,
      link: this.link,
    }

    return this._save(data)
  }
}
