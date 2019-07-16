import { addDays } from 'date-fns'
import uuid from 'uuid/v4'

import { knex } from '@/db'
import { Invite } from '@/modules/invite/invite.model'
import {
  Subscription,
  SubscriptionStatus,
} from '@/modules/subscription/subscription.model'
import {
  assertObjectEquals,
  cleanupDatabases,
  insertPlan,
  insertUser,
} from '@/utils/tests'
import { INVITE_ALREADY_USED } from '@/errors'

const createInvite = async (save = true, planUuid?: string) => {
  const invite = new Invite({
    shortId: await Invite.generateShortId(),
    cancelled: false,
    expiresAt: addDays(new Date(), 7),
    planUuid: planUuid || uuid(),
  })

  if (save) {
    await invite.save()
  }

  return invite
}

afterEach(cleanupDatabases)

afterAll(done => {
  jest.resetAllMocks()

  knex.destroy(done)
})

describe('invite.model', () => {
  test('.save()', async () => {
    const invite = await createInvite()

    const result = await Invite.table()
      .where({ uuid: invite.uuid })
      .first()

    expect(result).toBeDefined()

    expect(result!.uuid).toEqual(invite.uuid)
    expect(result!.short_id).toEqual(invite.shortId)
    expect(Boolean(result!.cancelled)).toEqual(invite.cancelled)
    expect(new Date(result!.expires_at)).toEqual(invite.expiresAt)
    expect(result!.plan_uuid).toEqual(invite.planUuid)
    expect(new Date(result!.created_at)).toEqual(invite.createdAt)
    expect(new Date(result!.updated_at)).toEqual(invite.updatedAt)
  })

  test('.fromSql()', async () => {
    const invite = await createInvite()

    const result = await Invite.table()
      .where({ uuid: invite.uuid })
      .first()

    expect(result).toBeDefined()

    const newInvite = Invite.fromSql(result!)

    assertObjectEquals(newInvite, invite)
  })

  describe('.exists()', () => {
    test('returns true when plan uuid exists', async () => {
      const plan = await createInvite()

      expect(plan.exists()).resolves.toEqual(true)
    })

    test('returns false when does not exist', async () => {
      const plan = await createInvite(false)

      expect(plan.exists()).resolves.toEqual(false)
    })
  })

  describe('.getByUuid()', () => {
    test('gets invite', async () => {
      const dbInvite = await createInvite()

      const invite = await Invite.getByUuid(dbInvite.uuid)

      assertObjectEquals(invite, dbInvite)
    })

    test('reject when not found', async () => {
      expect(Invite.getByUuid('😜')).rejects.toMatchObject({
        message: 'Could not find Invite:😜',
      })
    })
  })

  describe('.findByUuid()', () => {
    test('finds invite', async () => {
      const dbInvite = await createInvite()

      const result = await Invite.findByUuid(dbInvite.uuid)

      expect(result).toBeDefined()

      assertObjectEquals(result!, dbInvite)
    })

    test('returns null if not found', async () => {
      const nonExistantInvite = await createInvite(false)

      expect(Invite.findByUuid(nonExistantInvite.uuid)).resolves.toBeNull()
    })
  })

  describe('.findByPlan()', () => {
    test('gets plans', async () => {
      const plan = await insertPlan()

      const invites = await Promise.all([
        createInvite(true, plan.uuid),
        createInvite(true, plan.uuid),
        createInvite(true, plan.uuid),
      ])

      const gottenInvites = await Invite.findByPlan(plan.uuid)

      assertObjectEquals(gottenInvites, invites)
    })

    test('returns empty array if no invites were found', async () => {
      const plan = await insertPlan()

      const result = await Invite.findByPlan(plan.uuid)

      expect(result).toEqual([])
    })
  })

  test('.generateShortId()', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }).map(Invite.generateShortId),
    )

    results.forEach(id => {
      expect(id).toMatch(/[A-Z0-9]{6}/)
    })
  })

  describe('.cancel()', () => {
    test('cancels invite', async () => {
      const invite = await createInvite()

      const returned = await invite.cancel()
      const result = await Invite.getByUuid(invite.uuid)

      expect(returned.cancelled).toBe(true)
      expect(result.cancelled).toBe(true)
    })

    test('fails to cancel claimed invite', async () => {
      const owner = await insertUser({ index: 0 })
      const plan = await insertPlan({ ownerUuid: owner.uuid })
      const invite = await createInvite(true, plan.uuid)
      const user = await insertUser({ index: 1 })
      await Subscription.subscribeUser(plan, user, invite)

      const rejectFn = jest.fn()

      return invite
        .cancel()
        .catch(rejectFn)
        .then(() => {
          expect(rejectFn).toHaveBeenCalledWith(new Error(INVITE_ALREADY_USED))
        })
    })
  })

  describe('.user()', () => {
    test('gets user', async () => {
      const user = await insertUser()
      const plan = await insertPlan()

      const invite = await createInvite(true, plan.uuid)
      const subscription = new Subscription({
        userUuid: user.uuid,
        planUuid: plan.uuid,
        status: SubscriptionStatus.JOINED,
        inviteUuid: invite.uuid,
      })

      await subscription.save()

      const gottenUser = await invite.user()

      assertObjectEquals(gottenUser!, user)
    })

    test('returns null if not used yet', async () => {
      const invite = await createInvite()

      expect(invite.user()).resolves.toBeNull()
    })
  })
})
