/* eslint-disable @typescript-eslint/camelcase */
import { Field, ID, ObjectType, registerEnumType } from 'type-graphql'

import { DatabaseTable, knex, ITableData, ITableOptions } from '@/db'
import { DatabaseUser, User } from '@/modules/user/user.model'
import { isNil } from '@/utils'
import { Table } from '@/constants'

const table = () => knex('connection')

export enum ConnectionType {
  GOOGLE = 'GOOGLE',
}

registerEnumType(ConnectionType, {
  name: 'ConnectionType',
})

export interface ConnectionConstructor extends ITableOptions {
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

@ObjectType()
export class Connection extends DatabaseTable {
  public static readonly table = () => knex<DatabaseUser>(Table.CONNECTION)

  @Field(() => ConnectionType)
  public readonly type: ConnectionType
  @Field(() => ID)
  public readonly userId: string
  @Field()
  public readonly identifier: string
  @Field({ nullable: true })
  public readonly picture?: string
  @Field({ nullable: true })
  public readonly link?: string

  @Field(() => User)
  public readonly owner!: User
  public readonly ownerUuid: string
  public getOwner = async () => User.getByUuid(this.ownerUuid)

  constructor(options: ConnectionConstructor) {
    super(options)

    this.type = options.type
    this.ownerUuid = options.ownerUuid
    this.userId = options.userId
    this.identifier = options.identifier
    this.picture = options.picture
    this.link = options.link
  }

  public static fromSql(sql: ConnectionData & ITableData) {
    return new Connection({
      ...DatabaseTable._fromSql(sql),
      type: sql.type as ConnectionType,
      ownerUuid: sql.owner_uuid,
      userId: sql.user_id,
      identifier: sql.identifier,
      picture: sql.picture,
      link: sql.link,
    })
  }

  public static async findByUuid(uuid: string): Promise<Connection | null> {
    const sql = await table()
      .where({ uuid })
      .first()

    if (isNil(sql)) {
      return null
    }

    return Connection.fromSql(sql)
  }

  public static async getByUserUuid(ownerUuid: string): Promise<Connection[]> {
    const query: any = { owner_uuid: ownerUuid }

    const sql: any[] = await table().where(query)

    return sql.map(Connection.fromSql.bind(Connection))
  }

  public async save() {
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
