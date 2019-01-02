import knex from 'knex'
import mockDb from 'mock-knex'

export function createMockedKnex(
    mockResults: (query: mockDb.QueryDetails, step: number) => void
) {
    const db = knex({
        client: 'sqlite',
        useNullAsDefault: true
    })

    mockDb.mock(db)
    const tracker = mockDb.getTracker()

    tracker.on('query', mockResults)

    return db
}
