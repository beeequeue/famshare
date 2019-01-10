import { stripe } from '../lib/stripe'
import { DatabaseTable, knex, TableOptions } from '../db'

const table = () => knex('user')

interface Constructor extends TableOptions {
  uuid: string
  email: string
  discordId?: string
  stripeId?: string
}

interface TableData {
  email: string
  discord_id?: string
  stripe_id?: string
}

export class User extends DatabaseTable {
  public readonly discordId: string
  public readonly email: string
  public stripeId: string | null

  constructor(params: Constructor & TableData) {
    super(params)

    this.discordId = params.discord_id || (params.discordId as string)
    this.stripeId = params.stripe_id || params.stripeId || null
    this.email = params.email
  }

  public static getByUuid = async (uuid: string) => {
    const user = await table()
      .where({ uuid })
      .first()

    if (!user) throw new Error(`Could not find User:${uuid}`)

    return new User(user)
  }

  public static findByUuid = async (uuid: string) => {
    const user = await table()
      .where({ uuid })
      .first()

    if (!user) return null

    return new User(user)
  }

  public static findByDiscordId = async (id: string) => {
    const user = await table()
      .where({ discord_id: id })
      .first()

    if (!user) return null

    return new User(user)
  }

  public createStripeCustomer = async (stripeToken: string) => {
    const customer = await stripe.customers.create({
      email: this.email,
      source: stripeToken,
      metadata: { uuid: this.uuid },
    })

    if (!customer.id) {
      throw new Error('Could not create Stripe customer')
    }

    this.stripeId = customer.id

    await this.save()
  }

  public exists = async () => {
    const result = await table()
      .count()
      .where({ uuid: this.uuid })
      .orWhere({ discord_id: this.discordId })
      .first()

    return Number(result.count) === 1
  }

  public save = async () => {
    const data: TableData = {
      discord_id: this.discordId,
      email: this.email,
      stripe_id: this.stripeId as any,
    }

    return this._save(data)
  }
}
