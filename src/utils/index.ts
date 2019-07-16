export * from './functional'

export const IS_DEV = process.env.NODE_ENV === 'development'

export const mapAsync = async <T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
) => {
  const promises = items.map(fn)

  return Promise.all(promises)
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

export const pick = <T extends {}, K extends (keyof T)[]>(
  obj: T,
  keys: K,
): Pick<T, K[number]> =>
  Object.entries(obj)
    .filter(([key]) => keys.includes(key as keyof T))
    .reduce<Pick<T, K[number]>>(
      (obj, [key, val]) => Object.assign(obj, { [key]: val }),
      {} as any,
    )

export const roundToTwoDecimals = (n: number) => Number(n.toFixed(2))

export const fractionize = (n: number) => roundToTwoDecimals(n * 100)

export const defractionize = (n: number) => roundToTwoDecimals(n / 100)

export const basisPoints = (n: number) => roundToTwoDecimals(n * 10000)

export const unBasisPoints = (n: number) => roundToTwoDecimals(n / 10000)
