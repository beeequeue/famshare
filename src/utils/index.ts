import { Request } from 'express'

export * from './functional'

export type IResolver<R extends {} | null, A extends {} | null = null> = (
  args: A,
  request: Request,
) => Promise<R>

export const IS_DEV = process.env.NODE_ENV === 'development'

export const mapAsync = async <T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
) => {
  const promises = items.map(fn)

  return await Promise.all(promises)
}

export const mapToGraphQL = async <T extends { toGraphQL: Function }>(
  items: T[],
) => {
  const promises = items.map(item => item.toGraphQL())

  return await Promise.all(promises)
}

export const enumToArray = <T>(Enum: any): T[] =>
  Object.keys(Enum).map(key => Enum[key])

export const mapObject = <T extends {}, R extends {}>(
  obj: T,
  func: (item: T[keyof T], index: number) => R,
) => {
  const keys = Object.keys(obj)

  return keys.map((key, i) => func((obj as any)[key], i))
}

export const pick = <T extends {}, K extends Array<keyof T>>(
  obj: T,
  keys: K,
): Pick<T, K[number]> =>
  Object.entries(obj)
    .filter(([key]) => keys.includes(key as any))
    .reduce<Pick<T, K[number]>>(
      (obj, [key, val]) => Object.assign(obj, { [key]: val }),
      {} as any,
    )
