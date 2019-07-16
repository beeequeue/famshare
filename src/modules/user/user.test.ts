import { knex } from '@/db'
import { ConnectionType } from '@/modules/connection/connection.model'
import {
  assertObjectEquals,
  cleanupDatabases,
  insertInvite,
  insertPlan,
  insertUser,
} from '@/utils/tests'
import { DatabaseUser, User } from './user.model'
import { Subscription } from '@/modules/subscription/subscription.model'

const assertUserEquals = (result: DatabaseUser, user: User) => {
  expect(result.uuid).toEqual(user.uuid)
  expect(result.email).toEqual(user.email)
  expect(result.discord_id).toEqual(user.discordId)
  expect(result.stripe_id).toEqual(user.stripeId)
  expect(result.access_level).toEqual(user.accessLevel)
  expect(new Date(result.created_at)).toEqual(user.createdAt)
  expect(new Date(result.updated_at)).toEqual(user.updatedAt)
}

afterEach(cleanupDatabases)

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

    assertObjectEquals(newUser, user)
  })

  describe('.exists()', () => {
    test('returns true when uuid exists', async () => {
      const user = await insertUser()

      expect(user.exists()).resolves.toEqual(true)
    })

    test('returns true when discordId exists', async () => {
      const discordId = 'cool_discord_id'
      await insertUser({ index: 0, discord: discordId })

      const user = await insertUser({ index: 1, discord: discordId })

      expect(user.exists()).resolves.toEqual(true)
    })

    test('returns false when does not exist', () => {
      const nonExistentUser = new User({
        email: 'email@gmail.com',
        discordId: 'discord_id',
      })

      expect(nonExistentUser.exists()).resolves.toEqual(false)
    })
  })

  describe('.getByUuid()', () => {
    test('gets user', async () => {
      const dbUser = await insertUser()

      const user = await User.getByUuid(dbUser.uuid)

      assertObjectEquals(user, dbUser)
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

      assertObjectEquals(result!, dbUser)
    })

    test('returns null if not found', async () => {
      const nonExistentUser = new User({
        email: 'email@gmail.com',
        discordId: 'discord_id',
      })

      expect(User.findByUuid(nonExistentUser.uuid)).resolves.toBeNull()
    })
  })

  describe('.findByDiscordId()', () => {
    test('finds user', async () => {
      const dbUser = await insertUser()

      const result = await User.findByDiscordId(dbUser.discordId)

      expect(result).toBeDefined()

      assertObjectEquals(result!, dbUser)
    })

    test('returns null if not found', async () => {
      const nonExistentUser = new User({
        email: 'email@gmail.com',
        discordId: 'discord_id',
      })

      expect(
        User.findByDiscordId(nonExistentUser.discordId),
      ).resolves.toBeNull()
    })
  })

  describe('.createStripeCustomer()', () => {
    test('creates stripe customer and saves id to db', async () => {
      const user = await insertUser()

      await user.createStripeCustomer('stripe_token')

      const dbUser = await User.table()
        .where({ uuid: user.uuid })
        .first()

      expect(user.stripeId).toEqual('stripe_id')
      expect(dbUser!.stripe_id).toEqual('stripe_id')
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

      const connections = await user.connections()

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

      const connections = await user.connections()

      expect(connections[0]).toMatchObject(connectionData)
      expect(connections[1]).toMatchObject(connectionData2)
    })
  })

  test('.connections', async () => {
    const user = await insertUser()
    const connection = await user.connectWith({
      userId: 'dgfhjkhlödgf',
      identifier: 'zdfhuoöödoifg',
      type: ConnectionType.GOOGLE,
      picture: '235vgny890p',
      link: 'öldfhgöouhp94836',
    })

    const connections = await user.connections()

    assertObjectEquals(connections, [connection])
  })

  test('.subscriptions', async () => {
    const user = await insertUser()
    const plan = await insertPlan()
    const invite = await insertInvite({ planUuid: plan.uuid })

    const subscription = await Subscription.subscribeUser(plan, user, invite)

    const subscriptions = await user.subscriptions()

    assertObjectEquals(subscriptions, [subscription])
  })

  test('.plans', async () => {
    const user = await insertUser()
    const plans = await Promise.all([
      insertPlan({ ownerUuid: user.uuid }),
      insertPlan({ ownerUuid: user.uuid }),
      insertPlan({ ownerUuid: user.uuid }),
    ])

    const gottenPlans = await user.plans()

    assertObjectEquals(gottenPlans, plans)
  })
})
