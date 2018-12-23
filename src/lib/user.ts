import { knex } from '../db'

const table = knex('user')

interface Constructor {
  uuid: string
  email: string
  discord_id?: string
  discordId?: string
  created_at?: Date
  createdAt?: Date
}

export class User {
  public readonly uuid!: string
  public readonly discordId!: string
  public readonly email!: string
  public readonly createdAt!: Date

  constructor(params: Constructor) {
    const options = (params as any)[0]
    this.uuid = options.uuid
    ;(this.discordId = options.discord_id || (options.discordId as string)),
      (this.createdAt = options.created_at || options.createdAt || new Date()),
      (this.email = options.email)
  }

  public static getByUuid = async (uuid: string) => {
    const user = await table.where({ uuid })

    if (!user) throw new Error(`Could not find User:${uuid}`)

    return new User(user)
  }

  public static findByUuid = async (uuid: string) => {
    const user = await table.where({ uuid })

    if (!user) return null

    return new User(user)
  }

  public static findByDiscordId = async (id: string) => {
    const user = await table.where({ discord_id: id }).first()

    if (!user) return null

    return new User(user)
  }

  public exists = async () =>
    (await table
      .count()
      .where({ uuid: this.uuid })
      .orWhere({ discord_id: this.discordId })
      .orWhere({ email: this.email })) === 1

  public save = async () => {
    const data = {
      uuid: this.uuid,
      discord_id: this.discordId,
      email: this.email,
      created_at: this.createdAt,
    }

    if (await this.exists()) {
      await table.update(data).where({ uuid: this.uuid })

      return
    }

    await table.insert(data)
  }
}
