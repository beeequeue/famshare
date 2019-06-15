import { AccessLevel, DatabaseUser, User } from './user.model'
import { knex } from '@/db'

const assertUserEquals = (result: DatabaseUser, user: User) => {
  expect(result.uuid).toEqual(user.uuid)
  expect(result.email).toEqual(user.email)
  expect(result.discord_id).toEqual(user.discordId)
  expect(result.stripe_id).toEqual(user.stripeId)
  expect(result.access_level).toEqual(user.accessLevel)
  expect(new Date(result.created_at)).toEqual(user.createdAt)
  expect(new Date(result.updated_at)).toEqual(user.updatedAt)
}

const assertClassEquals = (result: User, user: User) => {
  expect(JSON.stringify(result, null, 2)).toEqual(JSON.stringify(user, null, 2))
}

afterEach(() => User.table().delete())

afterAll(done => {
  knex.destroy(done)
})

describe('user.model', () => {
  test('.save()', async () => {
    const user = new User({
      email: 'email@gmail.com',
      discordId: 'abcdefgh123456',
      stripeId: 'stripe_id',
      accessLevel: AccessLevel.ADMIN,
    })

    await user.save()

    const result = await User.table()
      .where({ uuid: user.uuid })
      .first()

    expect(result).toBeDefined()

    assertUserEquals(result!, user)
  })

  test('.fromSql()', async () => {
    const user = new User({
      email: 'email@gmail.com',
      discordId: 'abcdefgh123456',
    })

    await user.save()

    const result = await User.table()
      .where({ uuid: user.uuid })
      .first()

    expect(result).toBeDefined()

    const newUser = User.fromSql(result!)

    assertClassEquals(newUser, user)
  })

  describe('.exists()', () => {
    test('returns true when uuid exists', async () => {
      const user = new User({
        email: 'email@gmail.com',
        discordId: 'abcdefgh123456',
      })

      await user.save()

      expect(user.exists()).resolves.toBe(true)
    })

    test('returns true when discordId exists', async () => {
      let discordId = 'cool_discord_id'
      const user = new User({
        email: 'email@gmail.com',
        discordId,
      })

      await user.save()

      const newUser = new User({
        email: 'anything',
        discordId,
      })

      expect(newUser.exists()).resolves.toBe(true)
    })

    test('returns false when does not exist', () => {
      const nonExistantUser = new User({
        email: 'email@gmail.com',
        discordId: 'discord_id',
      })

      expect(nonExistantUser.exists()).resolves.toBe(false)
    })
  })

  describe('.getByUuid()', () => {
    test('gets user', async () => {
      const dbUser = new User({
        email: 'email@gmail.com',
        discordId: 'abcdefgh123456',
      })

      await dbUser.save()

      const user = await User.getByUuid(dbUser.uuid)

      assertClassEquals(user, dbUser)
    })

    test('reject when not found', async () => {
      expect(User.getByUuid('😜')).rejects.toMatchObject({
        message: 'Could not find User:😜',
      })
    })
  })

  describe('.findByUuid()', () => {})
})
