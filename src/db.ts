import Knex, { CreateTableBuilder, QueryBuilder } from 'knex'
import uuid from 'uuid/v4'

import config from '@/../knexfile'
import { AccessLevel, ConnectionType } from '@/graphql/types'
import { enumToArray } from '@/utils'

const { NODE_ENV } = process.env
export const knex = Knex(config[NODE_ENV as 'development' | 'production'])

enum Table {
  USER = 'user',
  SESSION = 'session',
  PLAN = 'plan',
  CONNECTION = 'connection',
  SUBSCRIPTION = 'subscription',
}

export interface TableOptions {
  uuid?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface TableData {
  uuid: string
  created_at: Date
  updated_at: Date
}

export class DatabaseTable {
  private readonly __name: string
  private readonly __table: () => QueryBuilder

  public readonly uuid: string
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(options: TableOptions) {
    const now = new Date()

    this.__name = this.constructor.name.toLowerCase()
    this.__table = () => knex(this.__name)
    this.uuid = options.uuid || uuid()
    this.createdAt = options.createdAt || now
    this.updatedAt = options.updatedAt || now
  }

  protected static _fromSql = (sql: TableData): Required<TableOptions> => ({
    uuid: sql.uuid,
    createdAt: sql.created_at,
    updatedAt: sql.updated_at,
  })

  public exists = async () => {
    const result = await this.__table()
      .count()
      .where({ uuid: this.uuid })
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
      uuid: this.uuid,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      ...extraData,
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
        .string('discord_id')
        .notNullable()
        .unique()

      table
        .string('email')
        .notNullable()
        .unique()

      table.enum('access_level', enumToArray(AccessLevel))

      table.string('stripe_id')
    }),

    createTableIfDoesNotExist(Table.SESSION, table => {
      table.uuid('user_uuid').notNullable()

      table.timestamp('expires_at').notNullable()
    }),

    createTableIfDoesNotExist(Table.PLAN, table => {
      table.string('name').notNullable()

      table.integer('amount').notNullable()

      table.integer('payment_day').notNullable()

      table.uuid('owner_uuid').notNullable()
    }),

    createTableIfDoesNotExist(Table.CONNECTION, table => {
      table.enum('type', enumToArray(ConnectionType)).notNullable()

      table.uuid('owner_uuid').notNullable()

      table.string('user_id').notNullable()

      table.string('identifier').notNullable()

      table.string('picture')

      table.string('link')
    }),

    createTableIfDoesNotExist(Table.SUBSCRIPTION, table => {
      table.uuid('plan_uuid').notNullable()

      table.uuid('user_uuid').notNullable()

      table.string('status').notNullable()
    }),
  )

  await Promise.all(promises)
}

initialize()
