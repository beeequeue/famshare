import uuid from 'uuid/v4'

import { Plan } from '@/modules/plan/plan.model'
import { cleanupDatabases } from '@/utils/tests'
// import { assertObjectEquals, insertPlan, insertUser } from '@/utils/tests'

afterEach(cleanupDatabases)

const createPlan = async (save = true) => {
  const plan = new Plan({
    name: 'plan_name',
    paymentDay: 30,
    amount: 1000_00,
    ownerUuid: uuid(),
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

  // test('.fromSql()', async () => {
  //   const subscription = await createSubscription()
  //
  //   const result = await Subscription.table()
  //     .where({ uuid: subscription.uuid })
  //     .first()
  //
  //   expect(result).toBeDefined()
  //
  //   const newSubscription = Subscription.fromSql(result!)
  //
  //   assertObjectEquals(newSubscription, subscription)
  // })
  //
  // describe('.exists()', () => {
  //   test('returns true when subscription with user and plan uuids exists', async () => {
  //     const subscription = await createSubscription()
  //
  //     expect(subscription.exists()).resolves.toEqual(true)
  //   })
  //
  //   test('returns false when does not exist', async () => {
  //     const subscription = await createSubscription(false)
  //
  //     expect(subscription.exists()).resolves.toEqual(false)
  //   })
  // })
  //
  // test('.subscribeUser()', async () => {
  //   const user = await insertUser()
  //   const plan = await insertPlan({ ownerUuid: user.uuid })
  //   const invite = await plan.createInvite()
  //
  //   const subscription = await plan.subscribeUser(user.uuid, invite.uuid)
  //
  //   const result = await Subscription.table()
  //     .where({ uuid: user.uuid })
  //     .first()
  //
  //   expect(result).toBeDefined()
  //
  //   assertObjectEquals(result!, user)
  // })
})
