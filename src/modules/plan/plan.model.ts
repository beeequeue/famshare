import { setDate } from 'date-fns'

import { DatabaseTable, knex, TableData, TableOptions } from '@/db'
import { Plan as GraphqlPlan, PlanType } from '@/graphql/types'
import { User } from '@/modules/user/user.model'

const table = () => knex('plan')

interface Constructor extends TableOptions {
  name: string
  type: PlanType
  paymentDueDay: number
  amount: number
  ownerUuid: string
}

interface PlanData {
  name: string
  type: PlanType
  payment_due_day: number
  amount: number
  owner_uuid: string
}

export class Plan extends DatabaseTable {
  public readonly name: string
  public readonly type: PlanType
  public readonly amount: number
  public readonly paymentDueDay: number
  public readonly ownerUuid: string

  constructor(options: Constructor) {
    super(options)

    this.name = options.name
    this.type = options.type
    this.amount = options.amount
    this.paymentDueDay = options.paymentDueDay
    this.ownerUuid = options.ownerUuid
  }

  public static fromSql = (sql: PlanData & TableData) =>
    new Plan({
      ...DatabaseTable._fromSql(sql),
      name: sql.name,
      type: sql.type as PlanType,
      amount: sql.amount,
      paymentDueDay: sql.payment_due_day,
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

  public toGraphQL = async (): Promise<GraphqlPlan> => ({
    uuid: this.uuid,
    name: this.name,
    type: this.type,
    amount: this.amount,
    paymentDue: setDate(new Date(), this.paymentDueDay),
    owner: await this.getOwner(),
    createdAt: this.createdAt,
  })

  public save = async () => {
    const data: PlanData = {
      name: this.name,
      type: this.type,
      amount: this.amount,
      payment_due_day: this.paymentDueDay,
      owner_uuid: this.ownerUuid,
    }

    return this._save(data)
  }
}
