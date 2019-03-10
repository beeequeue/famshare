export type Maybe<T> = T | null

export interface CreatePlanOptions {
  name: string

  type: PlanType

  amount: number
  /** 0-indexed day in month payments are done. */
  paymentDueDay: number
}

export enum PlanType {
  GOOGLE = 'GOOGLE',
}

/** A ISO-8601 formatted date. */

// ====================================================
// Scalars
// ====================================================

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
  createdAt: Date
}

export interface Mutation {
  /** Connect Viewer to a Stripe Token. */
  connectStripe: User

  createPlan: Plan
}

export interface Plan {
  name: string

  type: PlanType

  amount: number

  paymentDue: Date

  owner: User

  createdAt: Date
}

// ====================================================
// Arguments
// ====================================================

export interface UserQueryArgs {
  uuid: string
}
export interface ConnectStripeMutationArgs {
  token: string
}
export interface CreatePlanMutationArgs {
  options: CreatePlanOptions
}
