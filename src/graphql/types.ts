export type Maybe<T> = T | null

export interface CreatePlanOptions {
  name: string

  amount: number
  /** 1-indexed day in month payments are done. */
  paymentDay: number
}

export interface EditPlanOptions {
  uuid: string

  name?: Maybe<string>
}

export enum AccessLevel {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum AuthLevel {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  PLAN_OWNER = 'PLAN_OWNER',
  PLAN_MEMBER = 'PLAN_MEMBER',
  LOGGED_IN = 'LOGGED_IN',
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
  /** Returns a Plan if it exists. */
  plan?: Maybe<Plan>
}

export interface User {
  uuid: string

  email: string

  accessLevel?: Maybe<AccessLevel>

  discordId: string
  /** The User's Stripe ID if they've set up payments. */
  stripeId?: Maybe<string>
  /** The User's registration date and time. */
  createdAt: Date
}

export interface Plan {
  uuid: string

  name: string

  amount: number

  paymentDay: number

  nextPaymentDate: Date

  owner: User

  createdAt: Date
}

export interface Mutation {
  /** Connect Viewer to a Stripe Token. */
  connectStripe: User

  createPlan: Plan

  editPlan?: Maybe<Plan>
}

// ====================================================
// Arguments
// ====================================================

export interface UserQueryArgs {
  uuid: string
}
export interface PlanQueryArgs {
  uuid: string
}
export interface ConnectStripeMutationArgs {
  token: string
}
export interface CreatePlanMutationArgs {
  options: CreatePlanOptions
}
export interface EditPlanMutationArgs {
  options: EditPlanOptions
}
