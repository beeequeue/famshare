export type Maybe<T> = T | null

// ====================================================
// Types
// ====================================================

export interface Query {
  /** Returns a User if it exists. */
  user?: Maybe<User>
  /** The logged in User, if authenticated. */
  viewer?: Maybe<User>
}

export interface User {
  /** The User's UUID. */
  uuid: string
  /** The User's Email. */
  email: string
  /** The User's Discord ID. */
  discordId: string
  /** The User's Stripe ID if they've set up payments. */
  stripeId?: Maybe<string>
  /** The User's registration date and time. */
  createdAt?: Maybe<string>
}

// ====================================================
// Arguments
// ====================================================

export interface UserQueryArgs {
  uuid: string
}
