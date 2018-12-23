declare module '*/nuxt.config.js' {
  const content: any
  export = content
}

declare module 'nuxt' {
  export const Nuxt: any
  export const Builder: any
}
