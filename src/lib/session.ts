import uuid from 'uuid/v4'

import { knex } from '../db'

const WEEK = 1000 * 60 * 60 * 24 * 7
const table = () => knex('session')

export class Session {
  public uuid: string
  public userUuid: string
  public expiresAt: Date
  public createdAt: Date
  public updatedAt: Date

  constructor(
    userUuid: string,
    _uuid?: string,
    expiresAt?: Date,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    const date = new Date()

    this.uuid = _uuid || uuid()
    this.userUuid = userUuid
    this.expiresAt = expiresAt || new Date(Date.now() + WEEK)
    this.createdAt = createdAt || date
    this.updatedAt = updatedAt || date
  }

  public static generate = async (userUuid: string) => {
    const session = new Session(userUuid)

    await session.save()

    return session
  }

  public static fromSql = (sql: any) =>
    new Session(
      sql.user_uuid,
      sql.uuid,
      sql.expires_at,
      sql.created_at,
      sql.updated_at,
    )

  public static findByUuid = async (uuid: string) => {
    const session = await table()
      .where({ uuid })
      .first()

    if (!session) return null

    return Session.fromSql(session)
  }

  public exists = async () =>
    (await table()
      .count()
      .where({ uuid: this.uuid, user_uuid: this.userUuid })) === 1

  public save = async () => {
    const data = {
      uuid: this.uuid,
      user_uuid: this.userUuid,
      expires_at: this.expiresAt,
      created_at: this.createdAt,
      updated_at: new Date(),
    }

    if (await this.exists()) {
      await table()
        .update(data)
        .where({ uuid: this.uuid })

      return
    }

    await table().insert(data)
  }
}
