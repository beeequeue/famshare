import {
  ConnectionEnum,
  DatabaseTable,
  knex,
  TableData,
  TableOptions,
} from '@/db'
import { Omit } from '@/utils'

const table = () => knex('connection')

export interface ConnectionConstructor extends TableOptions {
  type: ConnectionEnum
  ownerUuid: string
  userId: string
  identifier: string
  picture: string
  link: string
}

interface ConnectionData {
  type: string
  owner_uuid: string
  user_id: string
  identifier: string
  picture: string
  link: string
}

type Connections = {
  [key in ConnectionEnum]?: Omit<ConnectionConstructor, keyof TableOptions>
}

export class Connection extends DatabaseTable {
  public readonly type: ConnectionEnum
  public readonly ownerUuid: string
  public readonly userId: string
  public readonly identifier: string
  public readonly picture: string
  public readonly link: string

  constructor(options: ConnectionConstructor) {
    super(options)

    this.type = options.type
    this.ownerUuid = options.ownerUuid
    this.userId = options.userId
    this.identifier = options.identifier
    this.picture = options.picture
    this.link = options.link
  }

  public static fromSql = (sql: ConnectionData & TableData) =>
    new Connection({
      ...DatabaseTable._fromSql(sql),
      type: sql.type as ConnectionEnum,
      ownerUuid: sql.owner_uuid,
      userId: sql.user_id,
      identifier: sql.identifier,
      picture: sql.picture,
      link: sql.link,
    })

  public static getByUserUuid = async (
    ownerUuid: string,
    filter?: ConnectionEnum,
  ): Promise<Connections> => {
    const data: Connections = {}
    const query: any = { owner_uuid: ownerUuid }

    if (filter != null) {
      query.type = filter
    }

    const connections: any[] = await table().where(query)

    if (!connections) return data

    connections.map(Connection.fromSql).forEach(conn => {
      data[conn.type] = conn
    })

    return data
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
