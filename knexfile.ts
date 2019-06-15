import { Environment } from './src/constants'

type KnexConfig = { [key in Environment]: import('knex').Config }

// This export is overridden by the module.exports at the end,
// but is required for TS to recognize it as a module
export const config: KnexConfig = {
  [Environment.DEVELOPMENT]: {
    client: 'sqlite3',
    connection: {
      filename: 'sqlite/dev.sqlite3',
    },
    useNullAsDefault: true,
  },

  [Environment.TEST]: {
    client: 'sqlite3',
    connection: {
      filename: 'sqlite/test.sqlite3',
    },
    useNullAsDefault: true,
  },

  [Environment.PRODUCTION]: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    useNullAsDefault: true,
  },
}

module.exports = {
  ...config,
  config,
}
