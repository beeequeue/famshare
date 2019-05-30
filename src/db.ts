import Knex, { CreateTableBuilder, QueryBuilder } from 'knex'
import { Field, ID, ObjectType } from 'type-graphql'
import uuid from 'uuid/v4'

import config from '@/../knexfile'

const { NODE_ENV } = process.env
export const knex = Knex(config[NODE_ENV as 'development' | 'production'])

export enum Table {
  USER = 'user',
  SESSION = 'session',
  PLAN = 'plan',
  CONNECTION = 'connection',
  SUBSCRIPTION = 'subscription',
  INVITE = 'invite',
}

export interface ITableOptions {
  uuid?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ITableData {
  uuid: string
  created_at: Date
  updated_at: Date
}

@ObjectType({ description: 'Not used - is base for all models.' })
export class DatabaseTable {
  private readonly __name: string
  private readonly __table: () => QueryBuilder

  @Field(() => ID)
  public readonly uuid: string
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(options: ITableOptions) {
    const now = new Date()

    this.__name = this.constructor.name.toLowerCase()
    this.__table = () => knex(this.__name)
    this.uuid = options.uuid || uuid()
    this.createdAt = options.createdAt || now
    this.updatedAt = options.updatedAt || now
  }

  protected static _fromSql = (sql: ITableData): Required<ITableOptions> => ({
    uuid: sql.uuid,
    createdAt: sql.created_at,
    updatedAt: sql.updated_at,
  })

  public exists = async <Q extends {}>(where?: Q) => {
    const result = await this.__table()
      .count()
      .where(where || { uuid: this.uuid })
      .first()

    return Number(result['count(*)']) === 1
  }

  public delete = async () => {
    if (!(await this.exists())) {
      throw new Error(
        `Tried to delete non-existant ${this.__name}-${this.uuid}`,
      )
    }

    await this.__table()
      .delete()
      .where({ uuid: this.uuid })
  }

  protected _save = async (extraData: any) => {
    const data = {
      /* eslint-disable @typescript-eslint/camelcase */
      uuid: this.uuid,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      ...extraData,
      /* eslint-enable @typescript-eslint/camelcase */
    }

    if (await this.exists()) {
      await this.__table()
        .update(data)
        .where({ uuid: this.uuid })

      return
    }

    await this.__table().insert(data)
  }
}

/**
 * Checks if a table exists, and creates it if it doesn't.
 * Always adds a `uuid` column.
 */
const createTableIfDoesNotExist = async (
  name: Table,
  cb: (tableBuilder: CreateTableBuilder) => void,
) => {
  try {
    await knex(name).count('uuid')
  } catch (e) {
    console.log(`Creating table ${name}`)

    await knex.schema.createTable(name, table => {
      table.uuid('uuid').primary()

      cb(table)

      table.timestamps(false, true)
    })
  }
}

const initialize = async () => {
  const promises: Promise<any>[] = []

  promises.push(
    createTableIfDoesNotExist(Table.USER, table => {
      table
        .string('discord_id', 50)
        .notNullable()
        .unique()

      table
        .string('email', 100)
        .notNullable()
        .unique()

      table.string('access_level', 25)

      table.string('stripe_id', 50)
    }),

    createTableIfDoesNotExist(Table.SESSION, table => {
      table.uuid('user_uuid').notNullable()

      table.timestamp('expires_at').notNullable()
    }),

    createTableIfDoesNotExist(Table.PLAN, table => {
      table.string('name', 100).notNullable()

      table.integer('amount').notNullable()

      table.integer('payment_day').notNullable()

      table.uuid('owner_uuid').notNullable()
    }),

    createTableIfDoesNotExist(Table.CONNECTION, table => {
      table.string('type', 25).notNullable()

      table.uuid('owner_uuid').notNullable()

      table.string('user_id', 100).notNullable()

      table.string('identifier', 100).notNullable()

      table.string('picture')

      table.string('link')
    }),

    createTableIfDoesNotExist(Table.SUBSCRIPTION, table => {
      table.uuid('plan_uuid').notNullable()

      table.uuid('user_uuid').notNullable()

      table.uuid('invite_uuid').notNullable()

      table.string('status', 25).notNullable()
    }),

    createTableIfDoesNotExist(Table.INVITE, table => {
      table.string('short_id', 20).notNullable()

      table.boolean('cancelled').notNullable()

      table.timestamp('expires_at').notNullable()

      table.uuid('plan_uuid').notNullable()
    }),
  )

  await Promise.all(promises)
}

initialize()
