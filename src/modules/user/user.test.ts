import { mocked } from 'ts-jest/utils'

import { knex } from '@/db'
import { stripe as _stripe } from '@/modules/stripe/stripe.lib'
import { AccessLevel, DatabaseUser, User } from './user.model'
import {
  Connection,
  ConnectionType,
} from '@/modules/connection/connection.model'

jest.mock('@/modules/stripe/stripe.lib')
const stripe = mocked(_stripe, true)

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

const insertUser = async (
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

afterEach(() =>
  Promise.all([User.table().delete(), Connection.table().delete()]),
)

afterAll(done => {
  jest.resetAllMocks()

  knex.destroy(done)
})

describe('user.model', () => {
  test('.save()', async () => {
    const user = await insertUser()

    const result = await User.table()
      .where({ uuid: user.uuid })
      .first()

    expect(result).toBeDefined()

    assertUserEquals(result!, user)
  })

  test('.fromSql()', async () => {
    const user = await insertUser()

    const result = await User.table()
      .where({ uuid: user.uuid })
      .first()

    expect(result).toBeDefined()

    const newUser = User.fromSql(result!)

    assertClassEquals(newUser, user)
  })

  describe('.exists()', () => {
    test('returns true when uuid exists', async () => {
      const user = await insertUser()

      expect(user.exists()).resolves.toEqual(true)
    })

    test('returns true when discordId exists', async () => {
      let discordId = 'cool_discord_id'
      await insertUser(undefined, discordId)

      const user = await insertUser('anything', discordId)

      expect(user.exists()).resolves.toEqual(true)
    })

    test('returns false when does not exist', () => {
      const nonExistantUser = new User({
        email: 'email@gmail.com',
        discordId: 'discord_id',
      })

      expect(nonExistantUser.exists()).resolves.toEqual(false)
    })
  })

  describe('.getByUuid()', () => {
    test('gets user', async () => {
      const dbUser = await insertUser()

      const user = await User.getByUuid(dbUser.uuid)

      assertClassEquals(user, dbUser)
    })

    test('reject when not found', async () => {
      expect(User.getByUuid('😜')).rejects.toMatchObject({
        message: 'Could not find User:😜',
      })
    })
  })

  describe('.findByUuid()', () => {
    test('finds user', async () => {
      const dbUser = await insertUser()

      const result = await User.findByUuid(dbUser.uuid)

      expect(result).toBeDefined()

      assertClassEquals(result!, dbUser)
    })

    test('returns null if not found', async () => {
      const nonExistantUser = new User({
        email: 'email@gmail.com',
        discordId: 'discord_id',
      })

      expect(User.findByUuid(nonExistantUser.uuid)).resolves.toBeNull()
    })
  })

  describe('.findByDiscordId()', () => {
    test('finds user', async () => {
      const dbUser = await insertUser()

      const result = await User.findByDiscordId(dbUser.discordId)

      expect(result).toBeDefined()

      assertClassEquals(result!, dbUser)
    })

    test('returns null if not found', async () => {
      const nonExistantUser = new User({
        email: 'email@gmail.com',
        discordId: 'discord_id',
      })

      expect(
        User.findByDiscordId(nonExistantUser.discordId),
      ).resolves.toBeNull()
    })
  })

  describe('.createStripeCustomer()', () => {
    test('creates stripe customer and saves id to db', async () => {
      stripe.customers.create.mockResolvedValueOnce({ id: 'stripe_id' } as any)
      const user = await insertUser()

      await user.createStripeCustomer('stripe_token')

      const dbUser = await User.table()
        .where({ uuid: user.uuid })
        .first()

      expect(user.stripeId).toEqual('stripe_id')
      expect(dbUser!.stripe_id).toEqual('stripe_id')
    })

    test('throws error if fails', async () => {
      stripe.customers.create.mockRejectedValue('failed')
      const user = await insertUser()

      const onError = jest.fn()
      return user
        .createStripeCustomer('stripe_token')
        .catch(onError)
        .then(() => {
          expect(onError).toHaveBeenCalledTimes(1)
        })
    })
  })

  describe('.connectWith()', () => {
    test('creates connection', async () => {
      const user = await insertUser()

      const connectionData = {
        userId: 'user_id',
        identifier: 'username',
        link: 'https://google.com',
        picture: 'https://i.imgur.com/foMcMUg.jpg',
        type: ConnectionType.GOOGLE,
      }
      await user.connectWith(connectionData)

      const connections = await user.getConnections()

      expect(connections[0]).toMatchObject(connectionData)
    })

    test('creates connection of already connected type', async () => {
      const user = await insertUser()

      const connectionData = {
        userId: 'user_id',
        identifier: 'username',
        link: 'https://google.com',
        picture: 'https://i.imgur.com/foMcMUg.jpg',
        type: ConnectionType.GOOGLE,
      }
      await user.connectWith(connectionData)

      const connectionData2 = {
        ...connectionData,
        userId: 'user_id_2',
      }
      await user.connectWith(connectionData2)

      const connections = await user.getConnections()

      expect(connections[0]).toMatchObject(connectionData)
      expect(connections[1]).toMatchObject(connectionData2)
    })
  })
})
