import { DatabaseTable, knex, TableData, TableOptions } from '@/db'
import { PlanType } from '@/graphql/types'

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
