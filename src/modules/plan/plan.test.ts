/* eslint-disable @typescript-eslint/camelcase */
import uuid from 'uuid/v4'
import { addDays, isEqual, parse } from 'date-fns'
import MockDate from 'mockdate'

import { knex } from '@/db'
import { Plan } from '@/modules/plan/plan.model'
import { Subscription } from '@/modules/subscription/subscription.model'
import {
  INVITE_NOT_FOUND,
  OWNER_OF_PLAN_SUBSCRIBE,
  USER_NOT_FOUND,
} from '@/errors'
import {
  assertObjectEquals,
  cleanupDatabases,
  insertInvite,
  insertUser,
} from '@/utils/tests'

const createPlan = async (
  save = true,
  ownerUuid?: string,
  paymentDay?: number,
) => {
  const plan = new Plan({
    name: 'plan_name',
    paymentDay: paymentDay || 12,
    amount: 1000_00,
    feeBasisPoints: 15_00,
    ownerUuid: ownerUuid || uuid(),
  })

  if (save) {
    await plan.save()
  }

  return plan
}

const createDate = (year: number, month: number, day: number) =>
  parse(`${year}-${month}-${day} +00`, 'yyyy-M-d x', new Date(), {
    weekStartsOn: 1,
  })

afterEach(cleanupDatabases)

afterAll(done => {
  jest.resetAllMocks()

  knex.destroy(done)
})

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

    test('rejects if user is owner of plan', async () => {
      const plan = await createPlan()
      const invite = await insertInvite({ planUuid: plan.uuid })

      expect(
        plan.subscribeUser(plan.ownerUuid, invite.shortId),
      ).rejects.toMatchObject({
        message: OWNER_OF_PLAN_SUBSCRIBE,
      })
    })

    test('rejects if invite does not exist', async () => {
      const user = await insertUser()
      const plan = await createPlan()

      return new Promise(resolve => {
        plan.subscribeUser(user.uuid, 'hahaha').catch(err => {
          expect(err).toMatchObject({ message: INVITE_NOT_FOUND })

          resolve()
        })
      })
    })
  })

  test('.owner()', async () => {
    const owner = await insertUser()
    const plan = await createPlan(true, owner.uuid)

    assertObjectEquals(await plan.owner(), owner)
  })

  describe('.members()', () => {
    test('gets members', async () => {
      const plan = await createPlan()
      const members = await Promise.all([
        insertUser({ index: 0 }),
        insertUser({ index: 1 }),
        insertUser({ index: 2 }),
      ])

      await Promise.all(
        members.map(async member => {
          const invite = await plan.createInvite(addDays(new Date(), 7))
          return plan.subscribeUser(member.uuid, invite.shortId)
        }),
      )

      const gottenMembers = await plan.members()

      gottenMembers.forEach((member, i) => {
        assertObjectEquals(member, members[i])
      })
    })

    test('returns empty array if no members exist', async () => {
      const plan = await createPlan()

      expect(plan.members()).resolves.toEqual([])
    })
  })

  describe('.invites()', () => {
    test('gets invites', async () => {
      const plan = await createPlan()
      const invites = await Promise.all([
        insertInvite({ planUuid: plan.uuid }),
        insertInvite({ planUuid: plan.uuid }),
        insertInvite({ planUuid: plan.uuid }),
      ])

      const gottenMembers = await plan.invites()

      gottenMembers.forEach((member, i) => {
        assertObjectEquals(member, invites[i])
      })
    })

    test('returns empty array if no invites exist', async () => {
      const plan = await createPlan()

      expect(plan.invites()).resolves.toEqual([])
    })
  })

  test('.getByOwnerUuid()', async () => {
    const owner = await insertUser()
    const plans = await Promise.all([
      createPlan(true, owner.uuid),
      createPlan(true, owner.uuid),
      createPlan(true, owner.uuid),
    ])

    const gottenPlans = await Plan.getByOwnerUuid(owner.uuid)

    assertObjectEquals(gottenPlans, plans)
  })

  describe('.nextPaymentDate()', () => {
    let plan: Plan

    beforeAll(async () => {
      plan = await createPlan()
    })

    afterEach(async () => {
      MockDate.reset()
    })

    test('returns correct date if before payment day', async () => {
      MockDate.set(createDate(2019, 6, 6))

      expect(isEqual(plan.nextPaymentDate(), createDate(2019, 6, 12)))
    })

    test("returns next month's date if after payment day", async () => {
      MockDate.set(createDate(2019, 6, 15))

      expect(isEqual(plan.nextPaymentDate(), createDate(2019, 7, 12)))
    })

    test('backs up if payment date does not exist in month', async () => {
      const latePlan = await createPlan(true, undefined, 30)

      MockDate.set(createDate(2019, 2, 1))

      expect(isEqual(latePlan.nextPaymentDate(), createDate(2019, 2, 28)))
    })
  })
})
