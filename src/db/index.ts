import Knex from 'knex'

export const knex = Knex({
  client: 'pg',
  connection: process.env.DB_URL as string,
  searchPath: ['famshare', 'public'],
  debug: true,
})

const initialize = async () => {
  try {
    await knex('user').count('uuid')
  } catch (e) {
    console.log('creating tables')

    await knex.schema.createTable('user', table => {
      table.string('uuid').primary()
      table
        .string('discord_id')
        .notNullable()
        .unique()
      table.timestamp('created_at')
    })
  }
}

initialize()
