/* eslint-disable @typescript-eslint/camelcase */
import {
  Authorized,
  Field,
  ID,
  ObjectType,
  registerEnumType,
} from 'type-graphql'

import { DatabaseTable, knex, ITableData, ITableOptions } from '@/db'
import {
  Connection,
  ConnectionConstructor,
} from '@/modules/connection/connection.model'
import { Plan } from '@/modules/plan/plan.model'
import { Subscription } from '@/modules/subscription/subscription.model'
import { stripe } from '@/modules/stripe/stripe.lib'
import { isNil } from '@/utils'
import { Table } from '@/constants'

export enum AccessLevel {
  ADMIN = 'ADMIN',
}

registerEnumType(AccessLevel, {
  name: 'AccessLevel',
})

interface Constructor extends ITableOptions {
  email: string
  accessLevel?: AccessLevel
  discordId?: string
  stripeId?: string
}

export interface DatabaseUser extends ITableData {
  email: string
  access_level?: AccessLevel
  discord_id?: string
  stripe_id?: string
}

@ObjectType()
export class User extends DatabaseTable<DatabaseUser> {
  public static readonly table = () => knex<DatabaseUser>(Table.USER)

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
  @Authorized([AccessLevel.ADMIN])
  @Field(() => ID, { nullable: true })
  public stripeId: string | null

  @Field(() => [Connection])
  public readonly connections!: Connection[]
  public getConnections = async () => Connection.getByUserUuid(this.uuid)

  @Field(() => [Subscription])
  public readonly subscriptions!: Subscription[]
  public getSubscriptions = async () => Subscription.getByUserUuid(this.uuid)

  @Field(() => [Plan], { description: 'Plans owned by this user' })
  public async plans(): Promise<Plan[]> {
    return Plan.getByOwnerUuid(this.uuid)
  }

  constructor(params: Constructor) {
    super(params)

    this.discordId = params.discordId as string
    this.email = params.email
    this.accessLevel = params.accessLevel || null
    this.stripeId = params.stripeId || null
  }

  public static fromSql(sql: DatabaseUser) {
    return new User({
      ...DatabaseTable._fromSql(sql),
      discordId: sql.discord_id,
      email: sql.email,
      accessLevel: sql.access_level,
      stripeId: sql.stripe_id,
    })
  }

  public static async getByUuid(uuid: string) {
    const user = await this.table()
      .where({ uuid })
      .first()

    if (!user) throw new Error(`Could not find User:${uuid}`)

    return User.fromSql(user)
  }

  public static async findByUuid(uuid: string) {
    const user = await this.table()
      .where({ uuid })
      .first()

    if (!user) return null

    return User.fromSql(user)
  }

  public static async findByDiscordId(id: string) {
    const user = await this.table()
      .where({ discord_id: id })
      .first()

    if (!user) return null

    return User.fromSql(user)
  }

  public async createStripeCustomer(stripeToken: string) {
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

  public async connectWith(
    data: Omit<
      ConnectionConstructor,
      'uuid' | 'ownerUuid' | 'createdAt' | 'updatedAt'
    >,
  ) {
    const connection = new Connection({
      ...data,
      ownerUuid: this.uuid,
    })

    return connection.save()
  }

  public async exists() {
    const result = await User.table()
      .count()
      .where({ uuid: this.uuid })
      .orWhere({ discord_id: this.discordId })
      .first()

    return result!['count(*)'] === 1
  }

  public async save() {
    return this._save({
      discord_id: this.discordId,
      email: this.email,
      access_level: this.accessLevel || undefined,
      stripe_id: this.stripeId as any,
    })
  }
}
