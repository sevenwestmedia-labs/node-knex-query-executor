import { ReadQueryExecutor } from '.'
import { createMockedKnex } from './test-helpers/knex'

const testTables = {
    tableOne: 'table-one'
}

it('can initialise read query executor', async () => {
    const knex = createMockedKnex(query => query.response([]))
    const queryExecutor = new ReadQueryExecutor(knex, {}, testTables)
    const tableNameQuery = queryExecutor.createQuery(
        async ({ tableNames }) => tableNames.tableOne
    )

    const tableName = await queryExecutor.execute(tableNameQuery).withArgs({})

    expect(tableName).toBe('table-one')
})

it('can wrap queryBuilder queries', async () => {
    let executedQuery: any

    const knex = createMockedKnex(query => query.response([]))
    const queryExecutor = new ReadQueryExecutor(knex, {}, testTables, {
        queryBuilderWrapper: query => {
            executedQuery = query.toString()

            return query
        }
    })
    const tableNameQuery = queryExecutor.createQuery(async ({ tables }) =>
        tables.tableOne()
    )

    await queryExecutor.execute(tableNameQuery).withArgs({})

    expect(executedQuery).toEqual('select * from `tableOne`')
})

it('can wrap raw queries', async () => {
    let executedQuery: any

    const knex = createMockedKnex(query => query.response([]))
    const queryExecutor = new ReadQueryExecutor(knex, {}, testTables, {
        rawQueryWrapper: query => {
            executedQuery = query.toString()

            return query
        }
    })
    const testQuery = queryExecutor.createQuery(async ({ query }) =>
        query(db => db.raw('select 1'))
    )

    await queryExecutor.execute(testQuery).withArgs({})

    expect(executedQuery).toEqual('select 1')
})

it('combined wrap API can wrap builder queries', async () => {
    let executedQuery: any

    const knex = createMockedKnex(query => query.response([]))
    const queryExecutor = new ReadQueryExecutor(
        knex,
        {},
        testTables,
        (query: any) => {
            executedQuery = query.toString()

            return query
        }
    )
    const testQuery = queryExecutor.createQuery(async ({ tables }) =>
        tables.tableOne()
    )

    await queryExecutor.execute(testQuery).withArgs({})

    expect(executedQuery).toEqual('select * from `tableOne`')
})

it('combined wrap API can wrap raw queries', async () => {
    let executedQuery: any

    const knex = createMockedKnex(query => query.response([]))
    const queryExecutor = new ReadQueryExecutor(
        knex,
        {},
        testTables,
        (query: any) => {
            executedQuery = query.toString()

            return query
        }
    )
    const testQuery = queryExecutor.createQuery(async ({ query }) =>
        query(db => db.raw('select 1'))
    )

    await queryExecutor.execute(testQuery).withArgs({})

    expect(executedQuery).toEqual('select 1')
})
