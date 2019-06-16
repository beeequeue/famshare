/* eslint-disable @typescript-eslint/camelcase */
import { DatabaseTable, knex, ITableData, ITableOptions } from '@/db'
import { Table } from '@/constants'
import { User } from '../user/user.model'

const WEEK = 1000 * 60 * 60 * 24 * 7
interface Constructor extends ITableOptions {
  userUuid: string
  expiresAt?: Date
}

interface DatabaseSession extends ITableData {
  user_uuid: string
  expires_at: Date
}

export class Session extends DatabaseTable<DatabaseSession> {
  public static readonly table = () => knex<DatabaseSession>(Table.SESSION)

  public userUuid: string
  public expiresAt: Date

  constructor(options: Constructor) {
    super(options)

    this.userUuid = options.userUuid
    this.expiresAt = options.expiresAt || new Date(Date.now() + WEEK)
  }

  public static fromSql(sql: DatabaseSession) {
    return new Session({
      ...DatabaseTable._fromSql(sql),
      userUuid: sql.user_uuid,
      expiresAt: sql.expires_at,
    })
  }

  public static async generate(userUuid: string) {
    const session = new Session({ userUuid })

    await session.save()

    return session
  }

  public static async findByUuid(uuid: string) {
    const session = await this.table()
      .where({ uuid })
      .first()

    if (!session) return null

    return Session.fromSql(session)
  }

  public async getUser() {
    return User.getByUuid(this.userUuid)
  }

  public async exists() {
    return super.exists({ uuid: this.uuid, user_uuid: this.userUuid })
  }

  public async save() {
    return this._save({
      user_uuid: this.userUuid,
      expires_at: this.expiresAt,
    })
  }
}
