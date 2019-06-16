import { AccessLevel, User } from '@/modules/user/user.model'
import { Plan } from '@/modules/plan/plan.model'
import { isNil } from '@/utils/functional'

export const insertUser = async (
  email?: string,
  discord?: string,
  stripe?: string,
) => {
  const user = new User({
    email: email || 'email@gmail.com',
    discordId: discord || 'discord_id',
    stripeId: stripe || 'stripe_id',
    accessLevel: AccessLevel.ADMIN,
  })

  await user.save()

  return user
}

interface InsertPlanOptions {
  ownerUuid?: string
  name?: string
  amount?: number
}

export const insertPlan = async ({
  ownerUuid,
  name,
  amount,
}: InsertPlanOptions) => {
  if (isNil(ownerUuid)) {
    ownerUuid = (await insertUser()).uuid
  }

  const plan = new Plan({
    name: name || 'plan',
    amount: amount || 12_99,
    paymentDay: 1,
    ownerUuid,
  })

  await plan.save()

  return plan
}

export const assertObjectEquals = <T extends {}>(result: T, user: T) => {
  expect(JSON.stringify(result, null, 2)).toEqual(JSON.stringify(user, null, 2))
}
