import Knex from 'knex'
import { Table } from '../src/constants'

export const up = async (knex: Knex): Promise<any> => {
  const promises: Promise<any>[] = []

  promises.push(
    knex.schema.createTable(Table.USER, table => {
      table.uuid('uuid').primary()

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

      table.timestamps(false, true)
    }),

    knex.schema.createTable(Table.SESSION, table => {
      table.uuid('uuid').primary()

      table.uuid('user_uuid').notNullable()

      table.timestamp('expires_at').notNullable()

      table.timestamps(false, true)
    }),

    knex.schema.createTable(Table.PLAN, table => {
      table.uuid('uuid').primary()

      table.string('name', 100).notNullable()

      table.integer('amount').notNullable()

      table.integer('fee_basis_points').notNullable()

      table.integer('payment_day').notNullable()

      table.uuid('owner_uuid').notNullable()

      table.timestamps(false, true)
    }),

    knex.schema.createTable(Table.CONNECTION, table => {
      table.uuid('uuid').primary()

      table.string('type', 25).notNullable()

      table.uuid('owner_uuid').notNullable()

      table.string('user_id', 100).notNullable()

      table.string('identifier', 100).notNullable()

      table.string('picture')

      table.string('link')

      table.timestamps(false, true)
    }),

    knex.schema.createTable(Table.SUBSCRIPTION, table => {
      table.uuid('uuid').primary()

      table.string('status', 25).notNullable()

      table.string('stripe_id', 35).notNullable()

      table.uuid('plan_uuid').notNullable()

      table.uuid('user_uuid').notNullable()

      table.uuid('invite_uuid').notNullable()

      table.timestamps(false, true)
    }),

    knex.schema.createTable(Table.INVITE, table => {
      table.uuid('uuid').primary()

      table.string('short_id', 20).notNullable()

      table.boolean('cancelled').notNullable()

      table.timestamp('expires_at').notNullable()

      table.uuid('plan_uuid').notNullable()

      table.timestamps(false, true)
    }),
  )

  return Promise.all(promises)
}

export const down = async (knex: Knex): Promise<any> =>
  knex.schema.dropTableIfExists('relations')
