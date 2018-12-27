import { ReadQueryExecutor } from '.'
import { createMockedKnex } from './test-helpers/knex'

const tables = {
    tableOne: 'table-one'
}

it('can initialise read query executor', async () => {
    const knex = createMockedKnex(query => query.response([]))
    const queryExecutor = new ReadQueryExecutor(knex, {}, tables)
    const tableNameQuery = queryExecutor.createQuery(
        async ({ tableNames }) => tableNames.tableOne
    )

    const tableName = await queryExecutor.execute(tableNameQuery).withArgs({})

    expect(tableName).toBe('table-one')
})
