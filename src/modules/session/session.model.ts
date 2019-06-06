/* eslint-disable @typescript-eslint/camelcase */
import { DatabaseTable, knex, ITableData, ITableOptions } from '@/db'
import { User } from '../user/user.model'

const WEEK = 1000 * 60 * 60 * 24 * 7
const table = () => knex<SessionData & ITableData>('session')

interface Constructor extends ITableOptions {
  userUuid: string
  expiresAt?: Date
}

interface SessionData {
  user_uuid: string
  expires_at: Date
}

export class Session extends DatabaseTable {
  public userUuid: string
  public expiresAt: Date

  constructor(options: Constructor) {
    super(options)

    this.userUuid = options.userUuid
    this.expiresAt = options.expiresAt || new Date(Date.now() + WEEK)
  }

  public static fromSql(sql: SessionData & ITableData) {
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
    const session = await table()
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
    const data: SessionData = {
      user_uuid: this.userUuid,
      expires_at: this.expiresAt,
    }

    return this._save(data)
  }
}
