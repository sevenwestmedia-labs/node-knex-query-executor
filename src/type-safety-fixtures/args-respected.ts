/* eslint-disable @typescript-eslint/no-unused-vars */
import { ReadQueryExecutor } from '../'
import { createMockedKnex } from '../test-helpers/knex'

const testTables = {
    tableOne: 'table-one',
}

export async function dontComplainAboutUnused() {
    let executedQuery: any

    const knex = createMockedKnex(query => query.response([]))
    const queryExecutor = new ReadQueryExecutor(knex, {}, testTables, {
        queryBuilderWrapper: query => {
            executedQuery = query.toString()
            return query
        },
    })

    const query2 = async (_: any, args: string) => {
        return args
    }

    const query1 = queryExecutor.createQuery(async ({ tables }, args) => {
        ;(() => args)()
        tables.tableOne()
        return {}
    })

    const query3 = queryExecutor.createQuery<{ id: number }, {}>(
        async ({ tables }, args) => {
            ;(() => args)()
            tables.tableOne()
            return {}
        },
    )

    const query4 = async (_, args: { id: number }) => {
        return {}
    }

    const query5 = async () => {
        return {}
    }

    await queryExecutor.execute(query1, 1)
    await queryExecutor.execute(query2, 1)
    await queryExecutor.execute(query3, {})
    await queryExecutor.execute(query4, {})
    await queryExecutor.execute(query5, {})
    await queryExecutor.execute(query5)

    await queryExecutor.execute(async () => 'x', {})

    return executedQuery
}
