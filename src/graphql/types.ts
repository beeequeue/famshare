import { AccessLevel } from '@/modules/user/user.model'
import { SubscriptionStatus } from '@/modules/subscription/subscription.model'
import { ConnectionType } from '@/modules/connection/connection.model'

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

export enum AuthLevel {
  ADMIN = 'ADMIN',
}

/** A ISO-8601 formatted date. E.g. 2019-04-09T11:28:11.479Z */

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

  connections: Connection[]

  subscriptions: Subscription[]
  /** The User's registration date and time. */
  createdAt: Date
}

export interface Connection {
  uuid: string

  type: ConnectionType

  owner: User

  userId: string

  identifier: string

  picture?: Maybe<string>

  link?: Maybe<string>

  createdAt: Date
}

export interface Subscription {
  uuid: string

  plan: Plan

  user: User

  status: SubscriptionStatus

  createdAt: Date
}

export interface Plan {
  uuid: string

  name: string

  amount: number
  /** 1-indexed day in month payments are done. */
  paymentDay: number
  /** The date the next payment will be attempted. */
  nextPaymentDate: Date

  owner: User

  invites: Invite[]

  createdAt: Date
}

export interface Invite {
  uuid: string

  shortId: string

  cancelled: boolean

  expiresAt: Date

  plan: Plan

  usedBy?: Maybe<User>

  createdAt: Date
}

export interface Mutation {
  /** Connect Viewer to a Stripe Token. */
  connectStripe: User

  createPlan: Plan

  editPlan: Plan
  /** Remove connection to a service */
  deleteConnection: User
  /** Subscribes Viewer to a Plan */
  subscribe: User
  /** Creates an Invite to a Plan */
  createInvite: Plan
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
export interface DeleteConnectionMutationArgs {
  type: ConnectionType
}
export interface SubscribeMutationArgs {
  uuid: string

  inviteId: string
}
export interface CreateInviteMutationArgs {
  planUuid: string

  expiresAt: Date
}
