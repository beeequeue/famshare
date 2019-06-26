import uuid from 'uuid/v4'

import { knex } from '@/db'
import {
  Connection,
  ConnectionType,
} from '@/modules/connection/connection.model'
import { assertObjectEquals, cleanupDatabases } from '@/utils/tests'

const createConnection = async (save = true, ownerUuid?: string) => {
  const connection = new Connection({
    type: ConnectionType.GOOGLE,
    picture: 'picture_url',
    link: 'a_link',
    identifier: 'identifier',
    userId: 'p7n92345v',
    ownerUuid: ownerUuid || uuid(),
  })

  if (save) {
    await connection.save()
  }

  return connection
}

afterEach(cleanupDatabases)

afterAll(done => {
  jest.resetAllMocks()

  knex.destroy(done)
})

describe('connection.model', () => {
  test('.save()', async () => {
    const connection = await createConnection()

    const result = await Connection.table()
      .where({ uuid: connection.uuid })
      .first()

    expect(result).toBeDefined()

    expect(result!.uuid).toEqual(connection.uuid)
    expect(result!.type).toEqual(connection.type)
    expect(result!.picture).toEqual(connection.picture)
    expect(result!.link).toEqual(connection.link)
    expect(result!.identifier).toEqual(connection.identifier)
    expect(result!.user_id).toEqual(connection.userId)
    expect(result!.owner_uuid).toEqual(connection.ownerUuid)
    expect(new Date(result!.created_at)).toEqual(connection.createdAt)
    expect(new Date(result!.updated_at)).toEqual(connection.updatedAt)
  })

  test('.fromSql()', async () => {
    const connection = await createConnection()

    const result = await Connection.table()
      .where({ uuid: connection.uuid })
      .first()

    expect(result).toBeDefined()

    const newConnection = Connection.fromSql(result!)

    assertObjectEquals(newConnection, connection)
  })

  describe('.exists()', () => {
    test('returns true when plan uuid exists', async () => {
      const plan = await createConnection()

      expect(plan.exists()).resolves.toEqual(true)
    })

    test('returns false when does not exist', async () => {
      const plan = await createConnection(false)

      expect(plan.exists()).resolves.toEqual(false)
    })
  })

  describe('.getByUserUuid()', () => {
    test('gets connection', async () => {
      const userUuid = uuid()
      const insertedConnections = await Promise.all([
        createConnection(true, userUuid),
        createConnection(true, userUuid),
        createConnection(true, userUuid),
      ])

      const connections = await Connection.getByUserUuid(userUuid)

      assertObjectEquals(connections, insertedConnections)
    })

    test('returns empty array if none exist', async () => {
      expect(Connection.getByUserUuid('😜')).resolves.toEqual([])
    })
  })

  describe('.findByUuid()', () => {
    test('finds connection', async () => {
      const dbConnection = await createConnection()

      const result = await Connection.findByUuid(dbConnection.uuid)

      expect(result).toBeDefined()

      assertObjectEquals(result!, dbConnection)
    })

    test('returns null if not found', async () => {
      const nonExistantConnection = await createConnection(false)

      expect(
        Connection.findByUuid(nonExistantConnection.uuid),
      ).resolves.toBeNull()
    })
  })
})
