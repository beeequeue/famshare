import uuid from 'uuid/v4'

import { knex } from '@/db'
import { Subscription, SubscriptionStatus } from './subscription.model'
import { assertObjectEquals } from '@/utils/tests'

const createSubscription = async (save = true, userUuid?: string) => {
  const subscription = new Subscription({
    userUuid: userUuid || uuid(),
    planUuid: uuid(),
    inviteUuid: uuid(),
    status: SubscriptionStatus.JOINED,
  })

  if (save) {
    await subscription.save()
  }

  return subscription
}

afterEach(() => Promise.all([Subscription.table().delete()]))

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
})
