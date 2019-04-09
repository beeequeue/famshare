import { Field, Int, ObjectType } from 'type-graphql'
import { addMonths, isAfter, setDate } from 'date-fns'

import { DatabaseTable, knex, TableData, TableOptions } from '@/db'
import { User } from '@/modules/user/user.model'
import { Invite } from '@/modules/invite/invite.model'
import { Plan as GraphqlPlan } from '@/graphql/types'
import { mapToGraphQL } from '@/utils'

const table = () => knex('plan')

interface Constructor extends TableOptions {
  name: string
  paymentDay: number
  amount: number
  ownerUuid: string
}

interface PlanData {
  name: string
  payment_day: number
  amount: number
  owner_uuid: string
}

@ObjectType()
export class Plan extends DatabaseTable {
  @Field()
  public name: string
  @Field(() => Int)
  public readonly amount: number
  @Field(() => Int)
  public readonly paymentDay: number
  public readonly ownerUuid: string

  constructor(options: Constructor) {
    super(options)

    this.name = options.name
    this.amount = options.amount
    this.paymentDay = options.paymentDay
    this.ownerUuid = options.ownerUuid
  }

  public static fromSql = (sql: PlanData & TableData) =>
    new Plan({
      ...DatabaseTable._fromSql(sql),
      name: sql.name,
      amount: sql.amount,
      paymentDay: sql.payment_day,
      ownerUuid: sql.owner_uuid,
    })

  public static findByUuid = async (uuid: string) => {
    const plan = await table()
      .where({ uuid })
      .first()

    if (!plan) return null

    return Plan.fromSql(plan)
  }

  public static getByUuid = async (uuid: string) => {
    const plan = await table()
      .where({ uuid })
      .first()

    if (!plan) throw new Error(`Could not find Plan:${uuid}`)

    return Plan.fromSql(plan)
  }

  public getOwner = async () => User.getByUuid(this.ownerUuid)

  public getInvites = async () => Invite.getByPlan(this.uuid)

  public createInvite = async (expiresAt: Date) => {
    const shortId = await Invite.generateShortId()

    const invite = new Invite({
      shortId,
      cancelled: false,
      expiresAt,
      planUuid: this.uuid,
    })

    await invite.save()

    return invite
  }

  public toGraphQL = async (): Promise<GraphqlPlan> => {
    let nextPaymentDate = setDate(new Date(), this.paymentDay)

    if (isAfter(new Date(), nextPaymentDate)) {
      nextPaymentDate = addMonths(nextPaymentDate, 1)
    }

    const user = await this.getOwner()
    const invites = await this.getInvites()

    return {
      uuid: this.uuid,
      name: this.name,
      amount: this.amount,
      paymentDay: this.paymentDay,
      nextPaymentDate,
      owner: await user.toGraphQL(),
      invites: await mapToGraphQL(invites),
      createdAt: this.createdAt,
    }
  }

  public save = async () => {
    const data: PlanData = {
      name: this.name,
      amount: this.amount,
      payment_day: this.paymentDay,
      owner_uuid: this.ownerUuid,
    }

    return this._save(data)
  }
}
