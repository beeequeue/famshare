declare module '*/schema.graphql' {
  const content: string
  export = content
}

declare module 'express-winston' {
  import { NextHandleFunction } from 'connect'
  import { Logger, LoggerOptions } from 'winston'
  import { Request, Response } from 'express'

  interface Options extends LoggerOptions {
    winstonInstance?: Logger
    ignoreRoute?: (req: Request, res: Response) => boolean
    slip?: (req: Request, res: Response) => boolean
    meta?: boolean
    msg?: string
    expressFormat?: boolean
    colorize?: boolean
  }

  export const logger: (opts: Options) => NextHandleFunction
}
