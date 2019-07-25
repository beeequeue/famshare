/* eslint-disable @typescript-eslint/camelcase */
import { addDays } from 'date-fns'
import uuid from 'uuid/v4'

import { knex } from '@/db'
import { Subscription, SubscriptionStatus } from './subscription.model'
import {
  assertObjectEquals,
  cleanupDatabases,
  insertInvite,
  insertPlan,
  insertUser,
} from '@/utils/tests'
import { Invite } from '@/modules/invite/invite.model'
import { INVITE_ALREADY_USED, OWNER_OF_PLAN_SUBSCRIBE } from '@/errors'
import { isNil } from '@/utils'
import { stripe } from '@/modules/stripe/stripe.lib'

const createSubscription = async (
  save = true,
  userUuid?: string,
  planUuid?: string,
  inviteUuid?: string,
  status?: SubscriptionStatus,
) => {
  if (isNil(userUuid)) {
    userUuid = (await insertUser()).uuid
  }
  if (isNil(planUuid)) {
    planUuid = (await insertPlan()).uuid
  }
  if (isNil(inviteUuid)) {
    inviteUuid = (await insertInvite({ planUuid })).uuid
  }

  const subscription = new Subscription({
    userUuid: userUuid,
    planUuid: planUuid,
    inviteUuid: inviteUuid,
    status: status || SubscriptionStatus.JOINED,
  })

  if (save) {
    await subscription.save()
  }

  return subscription
}

afterEach(cleanupDatabases)

afterAll(done => {
  jest.resetAllMocks()

  knex.destroy(done)
})

describe('subscription.model', () => {
  test('.save()', async () => {
    const subscription = await createSubscription()

    const result = await Subscription.table()
      .where({ uuid: subscription.uuid })
      .first()

    expect(result).toBeDefined()

    expect(result!.uuid).toEqual(subscription.uuid)
    expect(result!.user_uuid).toEqual(subscription.userUuid)
    expect(result!.plan_uuid).toEqual(subscription.planUuid)
    expect(result!.invite_uuid).toEqual(subscription.inviteUuid)
    expect(result!.status).toEqual(subscription.status)
    expect(new Date(result!.created_at)).toEqual(subscription.createdAt)
    expect(new Date(result!.updated_at)).toEqual(subscription.updatedAt)
  })

  test('.fromSql()', async () => {
    const subscription = await createSubscription()

    const result = await Subscription.table()
      .where({ uuid: subscription.uuid })
      .first()

    expect(result).toBeDefined()

    const newSubscription = Subscription.fromSql(result!)

    assertObjectEquals(newSubscription, subscription)
  })

  describe('.exists()', () => {
    test('returns true when subscription with user and plan uuids exists', async () => {
      const subscription = await createSubscription()

      expect(subscription.exists()).resolves.toEqual(true)
    })

    test('returns false when does not exist', async () => {
      const subscription = await createSubscription(false)

      expect(subscription.exists()).resolves.toEqual(false)
    })
  })

  describe('.getByUserUuid()', () => {
    test('gets subscriptions', async () => {
      const subscription = await createSubscription()
      const subscription2 = await createSubscription(
        true,
        subscription.userUuid,
      )

      const gottenSubscriptions = await Subscription.getByUserUuid(
        subscription.userUuid,
      )

      assertObjectEquals(gottenSubscriptions[0], subscription)
      assertObjectEquals(gottenSubscriptions[1], subscription2)
    })

    test('returns empty array when not found', async () => {
      expect(Subscription.getByUserUuid('😜')).resolves.toEqual([])
    })
  })

  describe('.findByUuid()', () => {
    test('finds subscription', async () => {
      const subscription = await createSubscription()

      const result = await Subscription.findByUuid(subscription.uuid)

      expect(result).toBeDefined()

      assertObjectEquals(result!, subscription)
    })

    test('returns null if not found', async () => {
      const subscription = await createSubscription(false)

      expect(Subscription.findByUuid(subscription.uuid)).resolves.toBeNull()
    })
  })

  test('.getByPlan()', async () => {
    const plan = await insertPlan()
    const subscription = await createSubscription(
      true,
      (await insertUser({ index: 1 })).uuid,
      plan.uuid,
    )

    const result = await Subscription.getByPlan(plan)

    expect(result).toBeDefined()

    assertObjectEquals(result!, [subscription])
  })

  describe('.subscribeUser()', () => {
    test('subscribes user', async () => {
      const user = await insertUser()
      const plan = await insertPlan()
      const invite = await insertInvite({ planUuid: plan.uuid })

      const subscription = await Subscription.subscribeUser(plan, user, invite)

      const result = await Subscription.table()
        .where({ user_uuid: user.uuid })
        .first()

      expect(result).toBeDefined()

      expect(result!.uuid).toEqual(subscription.uuid)
      expect(result!.plan_uuid).toEqual(subscription.planUuid)
    })

    test('rejects if user is owner of plan', async () => {
      const plan = await insertPlan()
      const user = await insertUser({ uuid: plan.ownerUuid })
      const invite = await insertInvite({ planUuid: plan.uuid })

      expect(
        Subscription.subscribeUser(plan, user, invite),
      ).rejects.toMatchObject({
        message: OWNER_OF_PLAN_SUBSCRIBE,
      })
    })

    test('rejects if invite is already claimed', async () => {
      const users = await Promise.all([
        insertUser({ index: 0 }),
        insertUser({ index: 1 }),
      ])
      const plan = await insertPlan()
      const invite = await insertInvite({ planUuid: plan.uuid })
      await Subscription.subscribeUser(plan, users[0], invite)

      const rejectFn = jest.fn()

      return Subscription.subscribeUser(plan, users[1], invite)
        .catch(rejectFn)
        .then(() => {
          expect(rejectFn).toHaveBeenCalledWith(new Error(INVITE_ALREADY_USED))
        })
    })

    test('rejects if already subscribed', async () => {
      const plan = await insertPlan()
      const users = await Promise.all([
        insertUser({ index: 0 }),
        insertUser({ index: 1 }),
      ])
      const invites = await Promise.all([insertInvite(), insertInvite()])
      await Subscription.subscribeUser(plan, users[0], invites[0])

      const rejectFn = jest.fn()

      return Subscription.subscribeUser(plan, users[0], invites[1])
        .catch(rejectFn)
        .then(() => {
          expect(rejectFn).toHaveBeenCalledWith(new Error())
        })
    })
  })

  test('.shouldPay()', async () => {
    const createWithStatus = (status: SubscriptionStatus) =>
      createSubscription(false, uuid(), uuid(), uuid(), status)

    const subscriptions = await Promise.all([
      createWithStatus(SubscriptionStatus.JOINED),
      createWithStatus(SubscriptionStatus.LATE),
      createWithStatus(SubscriptionStatus.CANCELLED),
      createWithStatus(SubscriptionStatus.EXPIRED),
      createWithStatus(SubscriptionStatus.EXEMPTED),
    ])

    expect(subscriptions.map(Subscription.shouldPay)).toEqual([
      true, // Joined
      true, // Late
      false, // Cancelled
      false, // Expired
      false, // Exempted
    ])
  })

  test('.setStatus()', async () => {
    const users = await Promise.all([
      insertUser({ index: 0 }),
      insertUser({ index: 1 }),
    ])
    const plan = await insertPlan()
    const invite = await insertInvite({ planUuid: plan.uuid })
    const subscription = await Subscription.subscribeUser(
      plan,
      users[0],
      invite,
    )

    await subscription.setStatus(SubscriptionStatus.ACTIVE)

    expect(subscription.status).toBe(SubscriptionStatus.ACTIVE)
    expect(await Subscription.getByPlan(plan)).toMatchObject([
      { status: SubscriptionStatus.ACTIVE },
    ])
  })

  test('.cancel()', async () => {
    const users = await Promise.all([
      insertUser({ index: 0 }),
      insertUser({ index: 1 }),
    ])
    const plan = await insertPlan()
    const invite = await insertInvite({ planUuid: plan.uuid })
    const subscription = await Subscription.subscribeUser(
      plan,
      users[0],
      invite,
    )

    await subscription.cancel()

    expect(stripe.subscriptions.del).toHaveBeenCalledTimes(1)
    expect(subscription.status).toBe(SubscriptionStatus.CANCELLED)
    expect(await Subscription.getByPlan(plan)).toMatchObject([
      { status: SubscriptionStatus.CANCELLED },
    ])
  })

  describe('getters', () => {
    test('.plan()', async () => {
      const plan = await insertPlan()

      const subscription = new Subscription({
        planUuid: plan.uuid,
        userUuid: uuid(),
        inviteUuid: uuid(),
        status: SubscriptionStatus.JOINED,
      })

      const gottenPlan = await subscription.plan()

      assertObjectEquals(gottenPlan, plan)
    })

    test('.user()', async () => {
      const user = await insertUser()

      const subscription = new Subscription({
        planUuid: uuid(),
        userUuid: user.uuid,
        inviteUuid: uuid(),
        status: SubscriptionStatus.JOINED,
      })

      const gottenUser = await subscription.user()

      assertObjectEquals(gottenUser, user)
    })

    test('.invite()', async () => {
      const invite = new Invite({
        shortId: 'abcdefgh',
        cancelled: false,
        expiresAt: addDays(new Date(), 7),
        planUuid: uuid(),
      })
      await invite.save()

      const subscription = new Subscription({
        planUuid: uuid(),
        userUuid: uuid(),
        inviteUuid: invite.uuid,
        status: SubscriptionStatus.JOINED,
      })

      const gottenInvite = await subscription.invite()

      assertObjectEquals(gottenInvite, invite)
    })
  })
})
