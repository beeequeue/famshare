import Knex, { QueryBuilder } from 'knex'
import { Field, ID, ObjectType } from 'type-graphql'
import uuid from 'uuid/v4'

import { config } from '../knexfile'

const { NODE_ENV } = process.env
export const knex = Knex(
  config[NODE_ENV as 'development' | 'production' | 'test'],
)

export interface ITableOptions {
  uuid?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ITableData {
  uuid: string
  created_at: Date
  updated_at: Date
}

@ObjectType({ description: 'Not used - is base for all models.' })
export class DatabaseTable {
  private readonly __name: string
  private readonly __table: () => QueryBuilder

  @Field(() => ID)
  public readonly uuid: string
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(options: ITableOptions) {
    const now = new Date()

    this.__name = this.constructor.name.toLowerCase()
    this.__table = () => knex(this.__name)
    this.uuid = options.uuid || uuid()
    this.createdAt = options.createdAt || now
    this.updatedAt = options.updatedAt || now
  }

  protected static _fromSql(sql: ITableData): Required<ITableOptions> {
    return {
      uuid: sql.uuid,
      createdAt: new Date(sql.created_at),
      updatedAt: new Date(sql.updated_at),
    }
  }

  public async exists<Q extends {}>(where?: Q) {
    const result = await this.__table()
      .count()
      .where(where || { uuid: this.uuid })
      .first()

    return Number(result['count(*)']) === 1
  }

  public async delete() {
    if (!(await this.exists())) {
      throw new Error(
        `Tried to delete non-existant ${this.__name}-${this.uuid}`,
      )
    }

    await this.__table()
      .delete()
      .where({ uuid: this.uuid })
  }

  protected async _save(extraData: any) {
    const data = {
      /* eslint-disable @typescript-eslint/camelcase */
      uuid: this.uuid,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      ...extraData,
      /* eslint-enable @typescript-eslint/camelcase */
    }

    if (await this.exists()) {
      await this.__table()
        .update(data)
        .where({ uuid: this.uuid })

      return
    }

    await this.__table().insert(data)
  }
}
