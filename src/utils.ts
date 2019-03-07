import { Request } from 'express'

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type Resolver<R extends {} | null, A extends {} | null = null> = (
  args: A,
  request: Request,
) => Promise<R>

export const enumToArray = <T>(Enum: any): T[] =>
  Object.keys(Enum).map(key => Enum[key])

export const IS_DEV = process.env.NODE_ENV === 'development'
