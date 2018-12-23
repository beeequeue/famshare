import Knex from 'knex'

export const knex = Knex({
  client: 'pg',
  connection: process.env.DB_URL as string,
  searchPath: ['famshare', 'public'],
})

const initialize = async () => {
  try {
    await knex('user').count('uuid')
  } catch (e) {
    console.log('creating user table')

    await knex.schema.createTable('user', table => {
      table.uuid('uuid').primary()

      table
        .string('discord_id')
        .notNullable()
        .unique()

      table
        .string('email')
        .notNullable()
        .unique()

      table.string('stripe_id')

      table.timestamp('created_at')
    })
  }

  try {
    await knex('session').count('uuid')
  } catch (e) {
    console.log('creating session table')

    await knex.schema.createTable('session', table => {
      table.uuid('uuid').primary()

      table.uuid('user_uuid').notNullable()

      table.timestamp('expires_at').notNullable()

      table.timestamps()
    })
  }
}

initialize()
