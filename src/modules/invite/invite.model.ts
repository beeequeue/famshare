/* eslint-disable @typescript-eslint/camelcase */
import { Field, ID, ObjectType } from 'type-graphql'

import { DatabaseTable, knex, ITableData, ITableOptions } from '@/db'
import { Plan } from '@/modules/plan/plan.model'
import { User } from '@/modules/user/user.model'
import { Table } from '@/constants'
import { INVITE_ALREADY_USED } from '@/errors'
import { isNil } from '@/utils'

export interface InviteConstructor extends ITableOptions {
  shortId: string
  cancelled: boolean
  expiresAt: Date
  planUuid: string
}

interface DatabaseInvite extends ITableData {
  short_id: string
  cancelled: boolean
  expires_at: Date
  plan_uuid: string
}

@ObjectType()
export class Invite extends DatabaseTable<DatabaseInvite> {
  public static readonly table = () => knex<DatabaseInvite>(Table.INVITE)

  @Field(() => ID)
  public readonly shortId: string
  @Field()
  public readonly cancelled: boolean
  @Field()
  public readonly expiresAt: Date

  @Field(() => Plan)
  public async plan(): Promise<Plan> {
    return Plan.getByUuid(this.planUuid)
  }
  public readonly planUuid: string

  @Field(() => User, { nullable: true })
  public async user(): Promise<User | null> {
    return this.getUser()
  }

  constructor(options: InviteConstructor) {
    super(options)

    this.shortId = options.shortId
    this.cancelled = options.cancelled
    this.expiresAt = options.expiresAt
    this.planUuid = options.planUuid
  }

  public static fromSql(sql: DatabaseInvite & ITableData) {
    return new Invite({
      ...DatabaseTable._fromSql(sql),
      shortId: sql.short_id,
      cancelled: Boolean(sql.cancelled),
      expiresAt: new Date(sql.expires_at),
      planUuid: sql.plan_uuid,
    })
  }

  public static async findByShortId(shortId: string): Promise<Invite | null> {
    const sql = await this.table()
      .where({ short_id: shortId })
      .first()

    if (isNil(sql)) {
      return null
    }

    return Invite.fromSql(sql)
  }

  public static async findByUuid(uuid: string): Promise<Invite | null> {
    const query = { uuid }

    const sql = await this.table()
      .where(query)
      .first()

    if (isNil(sql)) {
      if (!sql) return null
    }

    return Invite.fromSql(sql)
  }

  public static async getByUuid(uuid: string): Promise<Invite> {
    const query = { uuid }

    const sql = await this.table()
      .where(query)
      .first()

    if (isNil(sql)) {
      if (!sql) throw new Error(`Could not find Invite:${uuid}`)
    }

    return Invite.fromSql(sql)
  }

  public static async findByPlan(planUuid: string): Promise<Invite[]> {
    const sql = await this.table().where({ plan_uuid: planUuid })

    return sql.map(s => Invite.fromSql(s))
  }

  private static shortIdChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'

  public static async generateShortId(): Promise<string> {
    const chars = Invite.shortIdChars
    let id = ''

    do {
      id = ''

      for (let i = 0; i < 6; i++) {
        id += chars[Math.floor(Math.random() * chars.length)]
      }
    } while (await Invite.doesShortIdExist(id))

    return id
  }

  private static async doesShortIdExist(shortId: string) {
    const result = await this.table()
      .count()
      .where({ short_id: shortId })

    return Number(result['count(*)' as any]) === 1
  }

  private async getUser() {
    const result: any = await knex(Table.USER)
      .select('user.*')
      .innerJoin(Table.SUBSCRIPTION, function() {
        this.on('user.uuid', '=', 'subscription.user_uuid')
      })
      .innerJoin(Table.INVITE, function() {
        this.on('subscription.invite_uuid', '=', 'invite.uuid')
      })
      .where({ 'invite.uuid': this.uuid })
      .first()

    if (isNil(result)) {
      return null
    }

    return User.fromSql(result)
  }

  public async cancel() {
    if (this.cancelled) return this

    const isClaimed = !isNil(await this.user())
    if (isClaimed) {
      throw new Error(INVITE_ALREADY_USED)
    }

    const invite = new Invite({ ...this, cancelled: true })
    await invite.save()

    return invite
  }

  public async save() {
    return this._save({
      short_id: this.shortId,
      cancelled: this.cancelled,
      expires_at: this.expiresAt,
      plan_uuid: this.planUuid,
    })
  }
}
