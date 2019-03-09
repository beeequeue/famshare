import {
  ConnectionEnum,
  DatabaseTable,
  knex,
  TableData,
  TableOptions,
} from '@/db'
import {
  Connection,
  ConnectionConstructor,
} from '@/modules/connection/connection.model'
import { stripe } from '@/lib/stripe'
import { User as GraphqlUser } from '@/graphql/types'
import { Omit } from '@/utils'

const table = () => knex('user')

interface Constructor extends TableOptions {
  uuid: string
  email: string
  discordId?: string
  stripeId?: string
}

interface UserData {
  email: string
  discord_id?: string
  stripe_id?: string
}

export class User extends DatabaseTable {
  public readonly discordId: string
  public readonly email: string
  public stripeId: string | null

  constructor(params: Constructor) {
    super(params)

    this.discordId = params.discordId as string
    this.stripeId = params.stripeId || null
    this.email = params.email
  }

  public static fromSql = (sql: UserData & TableData) =>
    new User({
      ...DatabaseTable._fromSql(sql),
      discordId: sql.discord_id,
      email: sql.email,
      stripeId: sql.stripe_id,
    })

  public static getByUuid = async (uuid: string) => {
    const user = await table()
      .where({ uuid })
      .first()

    if (!user) throw new Error(`Could not find User:${uuid}`)

    return User.fromSql(user)
  }

  public static findByUuid = async (uuid: string) => {
    const user = await table()
      .where({ uuid })
      .first()

    if (!user) return null

    return User.fromSql(user)
  }

  public static findByDiscordId = async (id: string) => {
    const user = await table()
      .where({ discord_id: id })
      .first()

    if (!user) return null

    return User.fromSql(user)
  }

  public toGraphQL = (): GraphqlUser => ({
    uuid: this.uuid,
    discordId: this.discordId,
    email: this.email,
    stripeId: this.stripeId,
    createdAt: this.createdAt,
  })

  public getConnections = async (type?: ConnectionEnum) =>
    Connection.getByUserUuid(this.uuid, type)

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

  public connectWith = async (
    data: Omit<
      ConnectionConstructor,
      'uuid' | 'ownerUuid' | 'createdAt' | 'updatedAt'
    >,
  ) => {
    const connection = new Connection({
      ...data,
      ownerUuid: this.uuid,
    })

    return connection.save()
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
    const data: UserData = {
      discord_id: this.discordId,
      email: this.email,
      stripe_id: this.stripeId as any,
    }

    return this._save(data)
  }
}
