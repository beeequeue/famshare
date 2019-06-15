import { DatabaseUser, User } from './user.model'

const assertUserEquals = (result: DatabaseUser, user: User) => {
  expect(result.uuid).toBe(user.uuid)
  expect(result.email).toBe(user.email)
  expect(result.discord_id).toBe(user.discordId)
  expect(result.stripe_id).toBe(user.stripeId)
  expect(result.access_level).toBe(user.accessLevel)
  expect(result.created_at).toBe(user.createdAt)
  expect(result.updated_at).toBe(user.updatedAt)
}

afterAll(async () => Promise.all([User.table().delete]))

describe('user.model', () => {
  test('inserts model into database', async () => {
    const user = new User({
      email: 'email@gmail.com',
      discordId: 'abcdefgh123456',
    })

    await user.save()

    let result = await User.table()
      .where({ uuid: user.uuid })
      .first()

    expect(result).toBeDefined()

    assertUserEquals(result!, user)
  })
})
