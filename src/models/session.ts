import { DatabaseTable, knex, TableData, TableOptions } from '../db'
import { pick, map } from 'rambdax'
import { User } from '@/modules/user/user.model'
import { Connection } from '@/models/connection'

const WEEK = 1000 * 60 * 60 * 24 * 7
const table = () => knex('session')

interface Constructor extends TableOptions {
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

  public static fromSql = (sql: SessionData & TableData) =>
    new Session({
      ...DatabaseTable._fromSql(sql),
      userUuid: sql.user_uuid,
      expiresAt: sql.expires_at,
    })

  public static generate = async (userUuid: string) => {
    const session = new Session({ userUuid })

    await session.save()

    return session
  }

  public static findByUuid = async (uuid: string) => {
    const session = await table()
      .where({ uuid })
      .first()

    if (!session) return null

    return Session.fromSql(session)
  }

  public getUser = async () => {
    return User.getByUuid(this.userUuid)
  }

  public toSessionJSON = async () => {
    const user = await this.getUser()

    return {
      uuid: this.uuid,
      user: {
        ...pick<User, 'uuid' | 'discordId' | 'email' | 'stripeId'>(
          ['uuid', 'discordId', 'email', 'stripeId'],
          user,
        ),
        connections: map(
          u =>
            pick<
              Connection,
              'uuid' | 'userId' | 'identifier' | 'picture' | 'link'
            >(['uuid', 'userId', 'identifier', 'picture', 'link'], u as any),
          await user.getConnections(),
        ),
      },
      expiresAt: this.expiresAt,
    }
  }

  public exists = async () =>
    (await table()
      .count()
      .where({ uuid: this.uuid, user_uuid: this.userUuid })) === 1

  public save = async () => {
    const data: SessionData = {
      user_uuid: this.userUuid,
      expires_at: this.expiresAt,
    }

    return this._save(data)
  }
}
