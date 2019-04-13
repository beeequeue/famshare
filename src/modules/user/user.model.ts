import { Field, ID, ObjectType, registerEnumType } from 'type-graphql'

import { DatabaseTable, knex, ITableData, ITableOptions } from '@/db'
import {
  Connection,
  ConnectionConstructor,
} from '@/modules/connection/connection.model'
import { Subscription } from '@/modules/subscription/subscription.model'
import { stripe } from '@/modules/stripe/stripe.lib'
import { isNil } from '@/utils'

const table = () => knex('user')

export enum AccessLevel {
  ADMIN = 'ADMIN',
}

registerEnumType(AccessLevel, {
  name: 'AccessLevel',
})

interface Constructor extends ITableOptions {
  uuid: string
  email: string
  accessLevel?: AccessLevel
  discordId?: string
  stripeId?: string
}

interface UserData {
  email: string
  access_level?: AccessLevel
  discord_id?: string
  stripe_id?: string
}

@ObjectType()
export class User extends DatabaseTable {
  @Field(() => ID)
  public readonly discordId: string
  @Field()
  public readonly email: string
  @Field(() => AccessLevel, { nullable: true })
  public readonly accessLevel: AccessLevel | null
  @Field()
  public hasSetupStripe(): boolean {
    return !isNil(this.stripeId)
  }
  public stripeId: string | null

  @Field(() => [Connection])
  public readonly connections!: Connection[]
  public getConnections = async () => Connection.getByUserUuid(this.uuid)

  @Field(() => [Subscription])
  public readonly subscriptions!: Subscription[]
  public getSubscriptions = async () => Subscription.getByUserUuid(this.uuid)

  constructor(params: Constructor) {
    super(params)

    this.discordId = params.discordId as string
    this.email = params.email
    this.accessLevel = params.accessLevel || null
    this.stripeId = params.stripeId || null
  }

  public static fromSql = (sql: UserData & ITableData) =>
    new User({
      ...DatabaseTable._fromSql(sql),
      discordId: sql.discord_id,
      email: sql.email,
      accessLevel: sql.access_level,
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
      access_level: this.accessLevel || undefined,
      stripe_id: this.stripeId as any,
    }

    return this._save(data)
  }
}
