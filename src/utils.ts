export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export const enumToArray = <T>(Enum: any): T[] =>
  Object.keys(Enum).map(key => Enum[key])

export const IS_DEV = process.env.NODE_ENV === 'development'
