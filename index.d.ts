declare module '*/schema.graphql' {
  const content: string
  export = content
}

declare module '*/knexfile' {
  import { Config } from 'knex'

  const config: {
    development: Config
    production: Config
  }

  export = config
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

// For @types/superagent
type Blob = any
type XMLHttpRequest = any
