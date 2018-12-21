import { knex } from './index'

const table = knex('user')

interface Constructor {
  uuid: string
  discord_id?: string
  discordId?: string
  created_at?: Date
  createdAt?: Date
}

export class User {
  public readonly uuid!: string
  public readonly discordId!: string
  public readonly createdAt!: Date

  constructor(options: Constructor) {
    this.uuid = options.uuid
    ;(this.discordId = options.discord_id || (options.discordId as string)),
      (this.createdAt = options.created_at || options.createdAt || new Date())
  }

  public static findByUuid = async (uuid: string) => {
    const user = await knex('user').where({ uuid })

    return new User(user)
  }

  public static findByDiscordId = async (id: string) => {
    const user = await knex('user')
      .where({ discord_id: id })
      .first()

    if (!user) return null

    return new User(user)
  }

  public exists = async () =>
    (await table
      .count()
      .where({ uuid: this.uuid })
      .orWhere({ discord_id: this.discordId })) === 1

  public save = async () => {
    const data = {
      uuid: this.uuid,
      discord_id: this.discordId,
      created_at: this.createdAt,
    }

    if (await this.exists()) {
      await table.update(data).where({ uuid: this.uuid })

      return
    }

    await table.insert(data)
  }
}
