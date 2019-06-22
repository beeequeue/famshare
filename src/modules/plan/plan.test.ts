/* eslint-disable @typescript-eslint/camelcase */
import uuid from 'uuid/v4'
import { addDays } from 'date-fns'

import { Plan } from '@/modules/plan/plan.model'
import { Subscription } from '@/modules/subscription/subscription.model'
import { INVITE_NOT_FOUND, USER_NOT_FOUND } from '@/errors'
import {
  assertObjectEquals,
  cleanupDatabases,
  insertInvite,
  insertUser,
} from '@/utils/tests'

afterEach(cleanupDatabases)

const createPlan = async (save = true, ownerUuid?: string) => {
  const plan = new Plan({
    name: 'plan_name',
    paymentDay: 30,
    amount: 1000_00,
    ownerUuid: ownerUuid || uuid(),
  })

  if (save) {
    await plan.save()
  }

  return plan
}

describe('plan.model', () => {
  test('.save()', async () => {
    const plan = await createPlan()

    const result = await Plan.table()
      .where({ uuid: plan.uuid })
      .first()

    expect(result).toBeDefined()

    expect(result!.uuid).toEqual(plan.uuid)
    expect(result!.name).toEqual(plan.name)
    expect(result!.amount).toEqual(plan.amount)
    expect(result!.payment_day).toEqual(plan.paymentDay)
    expect(result!.owner_uuid).toEqual(plan.ownerUuid)
    expect(new Date(result!.created_at)).toEqual(plan.createdAt)
    expect(new Date(result!.updated_at)).toEqual(plan.updatedAt)
  })

  test('.fromSql()', async () => {
    const plan = await createPlan()

    const result = await Plan.table()
      .where({ uuid: plan.uuid })
      .first()

    expect(result).toBeDefined()

    const newPlan = Plan.fromSql(result!)

    assertObjectEquals(newPlan, plan)
  })

  describe('.exists()', () => {
    test('returns true when plan uuid exists', async () => {
      const plan = await createPlan()

      expect(plan.exists()).resolves.toEqual(true)
    })

    test('returns false when does not exist', async () => {
      const plan = await createPlan(false)

      expect(plan.exists()).resolves.toEqual(false)
    })
  })

  describe('.getByUuid()', () => {
    test('gets plan', async () => {
      const dbPlan = await createPlan()

      const plan = await Plan.getByUuid(dbPlan.uuid)

      assertObjectEquals(plan, dbPlan)
    })

    test('reject when not found', async () => {
      expect(Plan.getByUuid('😜')).rejects.toMatchObject({
        message: 'Could not find Plan:😜',
      })
    })
  })

  describe('.findByUuid()', () => {
    test('finds plan', async () => {
      const dbPlan = await createPlan()

      const result = await Plan.findByUuid(dbPlan.uuid)

      expect(result).toBeDefined()

      assertObjectEquals(result!, dbPlan)
    })

    test('returns null if not found', async () => {
      const nonExistantPlan = await createPlan(false)

      expect(Plan.findByUuid(nonExistantPlan.uuid)).resolves.toBeNull()
    })
  })

  test('.createInvite()', async () => {
    const plan = await createPlan()

    const expiresAt = addDays(new Date(), 7)
    const invite = await plan.createInvite(expiresAt)

    expect(invite).toMatchObject({
      cancelled: false,
      expiresAt,
      planUuid: plan.uuid,
    })
  })

  describe('.subscribeUser()', () => {
    test('subscribes user', async () => {
      const user = await insertUser()
      const plan = await createPlan()
      const invite = await insertInvite({ planUuid: plan.uuid })

      const subscription = await plan.subscribeUser(user.uuid, invite.shortId)

      const result = await Subscription.table()
        .where({ user_uuid: user.uuid })
        .first()

      expect(result).toBeDefined()

      expect(result!.uuid).toEqual(subscription.uuid)
      expect(result!.plan_uuid).toEqual(subscription.planUuid)
    })

    test('rejects if user does not exist', async () => {
      const plan = await createPlan()

      expect(plan.subscribeUser(uuid(), 'hahaha')).rejects.toMatchObject({
        message: USER_NOT_FOUND,
      })
    })

    test('rejects if invite does not exist', async () => {
      const user = await insertUser()
      const plan = await createPlan()

      expect(plan.subscribeUser(user.uuid, 'hahaha')).rejects.toMatchObject({
        message: INVITE_NOT_FOUND,
      })
    })
  })
})
