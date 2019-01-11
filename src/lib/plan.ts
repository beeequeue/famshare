import { QueryBuilder } from 'knex'

import { DatabaseTable, PlanEnum, TableData, TableOptions } from '../db'

let staticTable: () => QueryBuilder

interface Constructor extends TableOptions {
  type: PlanEnum
  ownerUuid: string
  paymentDueDay: Date
}

interface PlanData {
  type: PlanEnum
  owner_uuid: string
  payment_due_day: Date
}

export class Plan extends DatabaseTable {
  public readonly type: PlanEnum
  public readonly ownerUuid: string
  public readonly paymentDueDay: Date

  constructor(options: Constructor) {
    super(options)

    staticTable = this.table
    this.type = options.type
    this.ownerUuid = options.ownerUuid
    this.paymentDueDay = options.paymentDueDay
  }

  public static fromSql = (sql: PlanData & TableData) =>
    new Plan({
      ...DatabaseTable._fromSql(sql),
      type: sql.type as PlanEnum,
      ownerUuid: sql.owner_uuid,
      paymentDueDay: sql.payment_due_day,
    })

  public static findByUuid = async (uuid: string) => {
    const plan = await staticTable()
      .where({ uuid })
      .first()

    if (!plan) return null

    return Plan.fromSql(plan)
  }

  public save = async () => {
    const data: PlanData = {
      type: this.type,
      owner_uuid: this.ownerUuid,
      payment_due_day: this.paymentDueDay,
    }

    return this._save(data)
  }
}
